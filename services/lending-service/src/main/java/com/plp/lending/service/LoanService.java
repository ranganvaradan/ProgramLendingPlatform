package com.plp.lending.service;

import com.plp.lending.model.entity.Loan;
import com.plp.lending.model.enums.LoanStatus;
import com.plp.lending.repository.LoanRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoanService {

    private final LoanRepository loanRepository;
    private final EntityManager entityManager;

    @Transactional
    public Loan requestLoan(Loan loan) {
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

        loanRepository.save(loan);
        log.info("Loan disbursed: {} amount={}", loan.getLoanNumber(), disbursedAmount);
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
        }

        loanRepository.save(loan);
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
