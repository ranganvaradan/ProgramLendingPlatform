package com.plp.lending.service;

import com.plp.lending.event.LoanEventPublisher;
import com.plp.lending.model.entity.Loan;
import com.plp.lending.model.enums.LoanStatus;
import com.plp.lending.repository.LoanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.client.RestTemplate;

import jakarta.persistence.EntityManager;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final EntityManager entityManager;
    private final RestTemplate restTemplate;
    private final LoanEventPublisher loanEventPublisher;

    @Transactional
    public Loan requestLoan(Loan loan) {
        if (loan.getAnchorId() == null && loan.getProgramId() != null) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> programResponse = restTemplate.getForObject(
                        "http://program-service/api/v1/programs/{programId}",
                        Map.class, loan.getProgramId());
                if (programResponse != null && "SUCCESS".equals(programResponse.get("status"))) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> programData = (Map<String, Object>) programResponse.get("data");
                    if (programData != null && programData.containsKey("anchorId")) {
                        loan.setAnchorId(UUID.fromString(programData.get("anchorId").toString()));
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to resolve anchorId from program {}: {}", loan.getProgramId(), e.getMessage());
            }
            if (loan.getAnchorId() == null) {
                throw new RuntimeException("Unable to resolve anchor for program " + loan.getProgramId() + ". Please try again or contact support.");
            }
        }
        loan.setLoanNumber(generateLoanNumber(loan.getProductType()));
        loan.setRequestDate(LocalDate.now());
        loan.setStatus(LoanStatus.REQUESTED);
        loan.setTotalRepaid(BigDecimal.ZERO);
        loan.setPenalInterest(BigDecimal.ZERO);
        loan.setDpd(0);

        BigDecimal interest = calculateInterest(
                loan.getRequestedAmount(),
                loan.getInterestRate(),
                loan.getTenureDays()
        );
        loan.setInterestAmount(interest);

        BigDecimal processingFee = loan.getProcessingFee() != null ? loan.getProcessingFee() : BigDecimal.ZERO;
        loan.setTotalRepayable(loan.getRequestedAmount().add(interest).add(processingFee));
        loan.setOutstandingAmount(loan.getTotalRepayable());

        loan = loanRepository.save(loan);
        log.info("Loan requested: {} by borrower {} amount {}", loan.getLoanNumber(), loan.getBorrowerId(), loan.getRequestedAmount());
        loanEventPublisher.publishLoanEvent("LOAN_REQUESTED", loan);
        loanEventPublisher.publishAuditEvent("LOAN", loan.getId().toString(), "REQUESTED",
                null, null, null, "{\"loanNumber\":\"" + loan.getLoanNumber() + "\",\"amount\":" + loan.getRequestedAmount() + "}");
        return loan;
    }

    @Transactional
    public Loan approveLoan(UUID loanId, UUID approvedBy, BigDecimal sanctionedAmount) {
        Loan loan = getLoanForUpdate(loanId);
        if (loan.getStatus() != LoanStatus.REQUESTED && loan.getStatus() != LoanStatus.ELIGIBILITY_CHECK) {
            throw new RuntimeException("Loan cannot be approved. Current status: " + loan.getStatus());
        }

        loan.setSanctionedAmount(sanctionedAmount != null ? sanctionedAmount : loan.getRequestedAmount());
        loan.setApprovedBy(approvedBy);
        loan.setSanctionDate(LocalDate.now());
        loan.setStatus(LoanStatus.APPROVED);
        loan.setDueDate(LocalDate.now().plusDays(loan.getTenureDays()));

        BigDecimal interest = calculateInterest(loan.getSanctionedAmount(), loan.getInterestRate(), loan.getTenureDays());
        loan.setInterestAmount(interest);
        BigDecimal fee = loan.getProcessingFee() != null ? loan.getProcessingFee() : BigDecimal.ZERO;
        loan.setTotalRepayable(loan.getSanctionedAmount().add(interest).add(fee));
        loan.setOutstandingAmount(loan.getTotalRepayable());

        loanRepository.save(loan);
        log.info("Loan approved: {} sanctionedAmount={}", loan.getLoanNumber(), loan.getSanctionedAmount());
        loanEventPublisher.publishLoanEvent("LOAN_APPROVED", loan);
        loanEventPublisher.publishAuditEvent("LOAN", loan.getId().toString(), "APPROVED",
                approvedBy != null ? approvedBy.toString() : null, null,
                "{\"status\":\"REQUESTED\"}", "{\"status\":\"APPROVED\",\"sanctionedAmount\":" + loan.getSanctionedAmount() + "}");
        return loan;
    }

    @Transactional
    public Loan rejectLoan(UUID loanId, String reason) {
        Loan loan = getLoanForUpdate(loanId);
        if (loan.getStatus() != LoanStatus.REQUESTED && loan.getStatus() != LoanStatus.ELIGIBILITY_CHECK) {
            throw new RuntimeException("Loan cannot be rejected. Current status: " + loan.getStatus());
        }
        loan.setStatus(LoanStatus.REJECTED);
        loan.setRejectionReason(reason);
        loanRepository.save(loan);
        log.info("Loan rejected: {} reason={}", loan.getLoanNumber(), reason);
        loanEventPublisher.publishAuditEvent("LOAN", loan.getId().toString(), "REJECTED",
                null, null, "{\"status\":\"REQUESTED\"}", "{\"status\":\"REJECTED\",\"reason\":\"" + reason + "\"}");
        return loan;
    }

    @Transactional
    public Loan markDisbursed(UUID loanId, BigDecimal disbursedAmount) {
        Loan loan = getLoanForUpdate(loanId);
        if (loan.getStatus() != LoanStatus.APPROVED && loan.getStatus() != LoanStatus.DISBURSEMENT_PENDING) {
            throw new RuntimeException("Loan cannot be disbursed. Current status: " + loan.getStatus());
        }
        loan.setDisbursedAmount(disbursedAmount);
        loan.setDisbursementDate(LocalDate.now());
        loan.setStatus(LoanStatus.DISBURSED);
        loan.setDueDate(LocalDate.now().plusDays(loan.getTenureDays()));

        BigDecimal interest = calculateInterest(disbursedAmount, loan.getInterestRate(), loan.getTenureDays());
        loan.setInterestAmount(interest);
        BigDecimal fee = loan.getProcessingFee() != null ? loan.getProcessingFee() : BigDecimal.ZERO;
        loan.setTotalRepayable(disbursedAmount.add(interest).add(fee));
        loan.setOutstandingAmount(loan.getTotalRepayable());

        // Save loan state first — ensures DB commit succeeds before remote calls
        loanRepository.save(loan);
        entityManager.flush();
        log.info("Loan disbursed (local): {} amount={}", loan.getLoanNumber(), disbursedAmount);

        // Block borrower limit in program-service — mandatory for disbursement
        try {
            restTemplate.postForObject(
                    "http://program-service/api/v1/borrowers/{borrowerId}/limits/block?programId={programId}&amount={amount}",
                    null, Map.class, loan.getBorrowerId(), loan.getProgramId(), disbursedAmount);
            log.info("Limit blocked for borrower={} program={} amount={}", loan.getBorrowerId(), loan.getProgramId(), disbursedAmount);
        } catch (Exception e) {
            log.error("Failed to block limit for borrower {} — reverting disbursement: {}", loan.getBorrowerId(), e.getMessage());
            loan.setStatus(LoanStatus.APPROVED);
            loan.setDisbursedAmount(null);
            loan.setDisbursementDate(null);
            loanRepository.save(loan);
            throw new RuntimeException("Disbursement aborted: unable to block borrower limit. " + e.getMessage(), e);
        }

        // Mark invoice as discounted for INVOICE_DISCOUNTING loans
        if (loan.getInvoiceId() != null && "INVOICE_DISCOUNTING".equals(loan.getProductType())) {
            try {
                restTemplate.postForObject(
                        "http://program-service/api/v1/invoices/{invoiceId}/mark-discounted",
                        Map.of("amount", disbursedAmount), Map.class, loan.getInvoiceId());
                log.info("Invoice {} marked discounted amount={}", loan.getInvoiceId(), disbursedAmount);
            } catch (Exception e) {
                // Compensate: release the limit that was already blocked
                try {
                    restTemplate.postForObject(
                            "http://program-service/api/v1/borrowers/{borrowerId}/limits/release?programId={programId}&amount={amount}",
                            null, Map.class, loan.getBorrowerId(), loan.getProgramId(), disbursedAmount);
                    log.info("Compensating limit release for borrower={} amount={}", loan.getBorrowerId(), disbursedAmount);
                } catch (Exception releaseEx) {
                    log.error("CRITICAL: Failed to release limit after invoice mark failure. borrower={} amount={}: {}",
                            loan.getBorrowerId(), disbursedAmount, releaseEx.getMessage());
                    loanEventPublisher.publishLoanEventImmediate("LIMIT_RELEASE_REQUIRED", loan);
                }
                // Revert loan state
                loan.setStatus(LoanStatus.APPROVED);
                loan.setDisbursedAmount(null);
                loan.setDisbursementDate(null);
                loanRepository.save(loan);
                log.error("Failed to mark invoice {} as discounted — aborting disbursement: {}", loan.getInvoiceId(), e.getMessage());
                throw new RuntimeException("Disbursement aborted: unable to update invoice discounted amount. " + e.getMessage(), e);
            }
        }

        log.info("Loan disbursed: {} amount={}", loan.getLoanNumber(), disbursedAmount);
        loanEventPublisher.publishLoanEvent("LOAN_DISBURSED", loan);
        loanEventPublisher.publishAuditEvent("LOAN", loan.getId().toString(), "DISBURSED",
                null, null, "{\"status\":\"APPROVED\"}", "{\"status\":\"DISBURSED\",\"disbursedAmount\":" + disbursedAmount + "}");
        return loan;
    }

    @Transactional
    public Loan recordRepayment(UUID loanId, BigDecimal repaidAmount) {
        Loan loan = getLoanForUpdate(loanId);
        if (loan.getStatus() != LoanStatus.DISBURSED && loan.getStatus() != LoanStatus.REPAYMENT_DUE && loan.getStatus() != LoanStatus.OVERDUE) {
            throw new RuntimeException("Repayment cannot be recorded. Loan status: " + loan.getStatus());
        }
        loan.setTotalRepaid(loan.getTotalRepaid().add(repaidAmount));
        loan.setOutstandingAmount(loan.getTotalRepayable().subtract(loan.getTotalRepaid()));

        if (loan.getOutstandingAmount().compareTo(BigDecimal.ZERO) <= 0) {
            loan.setOutstandingAmount(BigDecimal.ZERO);
            loan.setStatus(LoanStatus.CLOSED);
            loan.setClosureDate(LocalDate.now());
            log.info("Loan closed: {}", loan.getLoanNumber());

            // Release borrower limit after transaction commits
            final UUID borrowerId = loan.getBorrowerId();
            final UUID programId = loan.getProgramId();
            final BigDecimal releaseAmount = loan.getDisbursedAmount();
            final UUID closedLoanId = loan.getId();
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    try {
                        restTemplate.postForObject(
                                "http://program-service/api/v1/borrowers/{borrowerId}/limits/release?programId={programId}&amount={amount}",
                                null, Map.class, borrowerId, programId, releaseAmount);
                        log.info("Limit released for borrower={} program={} amount={}", borrowerId, programId, releaseAmount);
                    } catch (Exception e) {
                        log.error("CRITICAL: Failed to release limit for borrower={} program={} amount={}: {}. Publishing compensating event.",
                                borrowerId, programId, releaseAmount, e.getMessage());
                        Loan failedLoan = loanRepository.findById(closedLoanId).orElse(null);
                        if (failedLoan != null) {
                            loanEventPublisher.publishLoanEvent("LIMIT_RELEASE_REQUIRED", failedLoan);
                        } else {
                            log.error("CRITICAL: Loan {} not found for LIMIT_RELEASE_REQUIRED event. Manual limit release needed for borrower={} program={} amount={}",
                                    closedLoanId, borrowerId, programId, releaseAmount);
                        }
                    }
                }
            });
        }

        loanRepository.save(loan);
        loanEventPublisher.publishLoanEvent("REPAYMENT_RECEIVED", loan);
        loanEventPublisher.publishAuditEvent("LOAN", loan.getId().toString(), "REPAYMENT",
                null, null, null, "{\"repaidAmount\":" + repaidAmount + ",\"outstanding\":" + loan.getOutstandingAmount() + ",\"status\":\"" + loan.getStatus() + "\"}");
        return loan;
    }

    public Loan getLoan(UUID loanId) {
        return loanRepository.findById(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found: " + loanId));
    }

    private Loan getLoanForUpdate(UUID loanId) {
        return loanRepository.findByIdForUpdate(loanId)
                .orElseThrow(() -> new RuntimeException("Loan not found: " + loanId));
    }

    public List<Loan> getLoansByBorrower(UUID borrowerId) {
        return loanRepository.findByBorrowerId(borrowerId);
    }

    public List<Loan> getLoansByProgram(UUID programId) {
        return loanRepository.findByProgramId(programId);
    }

    public List<Loan> getAllLoans() {
        return loanRepository.findAll();
    }

    public List<Loan> getOverdueLoans() {
        return loanRepository.findOverdueLoans();
    }

    private BigDecimal calculateInterest(BigDecimal principal, BigDecimal annualRate, int days) {
        if (annualRate == null || annualRate.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return principal
                .multiply(annualRate)
                .multiply(BigDecimal.valueOf(days))
                .divide(BigDecimal.valueOf(36500), 2, RoundingMode.HALF_UP);
    }

    private String generateLoanNumber(String productType) {
        String prefix = "PDL".equals(productType) || "PAY_DAY_LOAN".equals(productType) ? "PDL" : "IDF";
        Long seq = (Long) entityManager.createNativeQuery("SELECT nextval('plp_lending.loan_number_seq')")
                .getSingleResult();
        return prefix + "-" + seq;
    }
}
