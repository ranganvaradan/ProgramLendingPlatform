package com.plp.lending.service;

import com.plp.lending.model.entity.Loan;
import com.plp.lending.model.enums.LoanStatus;
import com.plp.lending.repository.LoanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EligibilityService {

    private final LoanRepository loanRepository;
    private final RestTemplate restTemplate;

    /**
     * Check eligibility for a Pay Day Loan request.
     * Returns eligibility result with max eligible amount and reasons.
     */
    public Map<String, Object> checkPayDayLoanEligibility(UUID borrowerId, UUID programId, BigDecimal requestedAmount) {
        Map<String, Object> result = new HashMap<>();
        result.put("borrowerId", borrowerId.toString());
        result.put("programId", programId.toString());
        result.put("requestedAmount", requestedAmount);

        List<String> reasons = new java.util.ArrayList<>();
        boolean eligible = true;

        // 1. Check active loans (should be none or within concurrent limit)
        List<Loan> activeLoans = loanRepository.findByBorrowerId(borrowerId).stream()
                .filter(l -> l.getStatus() == LoanStatus.DISBURSED
                        || l.getStatus() == LoanStatus.REPAYMENT_DUE
                        || l.getStatus() == LoanStatus.OVERDUE)
                .toList();

        // 2. Check for overdue loans
        boolean hasOverdue = activeLoans.stream()
                .anyMatch(l -> l.getStatus() == LoanStatus.OVERDUE);
        if (hasOverdue) {
            eligible = false;
            reasons.add("Borrower has overdue loans");
        }

        // 2b. Check concurrent loan limit
        int maxConcurrentLoans = 1;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> limitResponse = restTemplate.getForObject(
                    "http://program-service/api/v1/borrowers/{borrowerId}/limits",
                    Map.class, borrowerId);
            if (limitResponse != null && "SUCCESS".equals(limitResponse.get("status"))) {
                @SuppressWarnings("unchecked")
                Map<String, Object> limitData = (Map<String, Object>) limitResponse.get("data");
                if (limitData != null && limitData.containsKey("maxConcurrentLoans")) {
                    maxConcurrentLoans = ((Number) limitData.get("maxConcurrentLoans")).intValue();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch limit config for borrower {}: {}", borrowerId, e.getMessage());
        }
        if (activeLoans.size() >= maxConcurrentLoans) {
            eligible = false;
            reasons.add("Maximum concurrent loans reached: " + activeLoans.size() + "/" + maxConcurrentLoans);
        }

        // 3. Fetch salary data from program-service
        BigDecimal eligibleAmount = BigDecimal.ZERO;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> salaryResponse = restTemplate.getForObject(
                    "http://program-service/api/v1/salary/borrower/{borrowerId}/latest",
                    Map.class, borrowerId);
            if (salaryResponse != null && "SUCCESS".equals(salaryResponse.get("status"))) {
                @SuppressWarnings("unchecked")
                Map<String, Object> salaryData = (Map<String, Object>) salaryResponse.get("data");
                if (salaryData != null && salaryData.containsKey("eligibleAmount")) {
                    Object amt = salaryData.get("eligibleAmount");
                    eligibleAmount = amt instanceof Number
                            ? BigDecimal.valueOf(((Number) amt).doubleValue())
                            : new BigDecimal(amt.toString());
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch salary data for borrower {}: {}", borrowerId, e.getMessage());
            eligible = false;
            reasons.add("Salary data not available");
        }

        if (eligibleAmount.compareTo(BigDecimal.ZERO) <= 0) {
            eligible = false;
            reasons.add("No eligible salary amount for current period");
        }

        // 4. Check requested amount against eligible
        if (eligible && requestedAmount.compareTo(eligibleAmount) > 0) {
            eligible = false;
            reasons.add("Requested amount exceeds eligible amount: " + eligibleAmount);
        }

        result.put("eligible", eligible);
        result.put("eligibleAmount", eligibleAmount);
        result.put("activeLoans", activeLoans.size());
        result.put("reasons", reasons);

        log.info("Eligibility check: borrower={} program={} eligible={} eligibleAmount={} requested={}",
                borrowerId, programId, eligible, eligibleAmount, requestedAmount);
        return result;
    }

    public Map<String, Object> checkInvoiceDiscountingEligibility(UUID borrowerId, UUID programId,
                                                                    UUID invoiceId, BigDecimal requestedAmount) {
        Map<String, Object> result = new HashMap<>();
        result.put("borrowerId", borrowerId.toString());
        result.put("programId", programId.toString());
        result.put("invoiceId", invoiceId.toString());
        result.put("requestedAmount", requestedAmount);

        List<String> reasons = new java.util.ArrayList<>();
        boolean eligible = true;

        // 1. Check for overdue loans
        boolean hasOverdue = loanRepository.findByBorrowerId(borrowerId).stream()
                .anyMatch(l -> l.getStatus() == LoanStatus.OVERDUE);
        if (hasOverdue) {
            eligible = false;
            reasons.add("Borrower has overdue loans");
        }

        // 2. Fetch invoice data from program-service
        BigDecimal availableAmount = BigDecimal.ZERO;
        String invoiceStatus = "UNKNOWN";
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> invoiceResponse = restTemplate.getForObject(
                    "http://program-service/api/v1/invoices/{invoiceId}",
                    Map.class, invoiceId);
            if (invoiceResponse != null) {
                Object avail = invoiceResponse.get("availableAmount");
                if (avail != null) {
                    availableAmount = avail instanceof Number
                            ? BigDecimal.valueOf(((Number) avail).doubleValue())
                            : new BigDecimal(avail.toString());
                }
                Object status = invoiceResponse.get("status");
                if (status != null) {
                    invoiceStatus = status.toString();
                }
                Object verified = invoiceResponse.get("verified");
                if (verified == null || !Boolean.TRUE.equals(verified)) {
                    eligible = false;
                    reasons.add("Invoice is not verified");
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch invoice data for invoice {}: {}", invoiceId, e.getMessage());
            eligible = false;
            reasons.add("Invoice data not available");
        }

        // 3. Check invoice status
        if (!"VERIFIED".equals(invoiceStatus) && !"ELIGIBLE".equals(invoiceStatus)
                && !"PARTIALLY_DISCOUNTED".equals(invoiceStatus)) {
            eligible = false;
            reasons.add("Invoice status not eligible: " + invoiceStatus);
        }

        // 4. Check available amount on invoice
        if (availableAmount.compareTo(BigDecimal.ZERO) <= 0) {
            eligible = false;
            reasons.add("No available amount on this invoice");
        }

        // 5. Check requested amount
        if (eligible && requestedAmount.compareTo(availableAmount) > 0) {
            eligible = false;
            reasons.add("Requested amount exceeds available: " + availableAmount);
        }

        // 6. Check borrower limit via program-service
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> limitResponse = restTemplate.getForObject(
                    "http://program-service/api/v1/borrowers/{borrowerId}/limits",
                    Map.class, borrowerId);
            if (limitResponse != null && "SUCCESS".equals(limitResponse.get("status"))) {
                @SuppressWarnings("unchecked")
                Map<String, Object> limitData = (Map<String, Object>) limitResponse.get("data");
                if (limitData != null) {
                    Object availLimit = limitData.get("availableLimit");
                    if (availLimit != null) {
                        BigDecimal limit = availLimit instanceof Number
                                ? BigDecimal.valueOf(((Number) availLimit).doubleValue())
                                : new BigDecimal(availLimit.toString());
                        if (eligible && requestedAmount.compareTo(limit) > 0) {
                            eligible = false;
                            reasons.add("Requested amount exceeds borrower limit: " + limit);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch limit for borrower {}: {}", borrowerId, e.getMessage());
            eligible = false;
            reasons.add("Borrower limit data not available");
        }

        result.put("eligible", eligible);
        result.put("availableAmount", availableAmount);
        result.put("invoiceStatus", invoiceStatus);
        result.put("reasons", reasons);

        log.info("Invoice eligibility: borrower={} invoice={} eligible={} available={} requested={}",
                borrowerId, invoiceId, eligible, availableAmount, requestedAmount);
        return result;
    }
}
