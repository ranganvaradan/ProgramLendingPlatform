package com.plp.lending.controller;

import com.plp.lending.model.entity.Loan;
import com.plp.lending.service.EligibilityService;
import com.plp.lending.service.LoanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/portal/borrower")
@RequiredArgsConstructor
public class BorrowerPortalController {

    private final LoanService loanService;
    private final EligibilityService eligibilityService;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", Map.of(
                "message", "Borrower portal dashboard",
                "userId", userId
        )));
    }

    @GetMapping("/loans")
    public ResponseEntity<Map<String, Object>> myLoans(@RequestParam UUID borrowerId) {
        List<Loan> loans = loanService.getLoansByBorrower(borrowerId);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", loans));
    }

    @GetMapping("/eligibility")
    public ResponseEntity<Map<String, Object>> checkEligibility(
            @RequestParam UUID borrowerId,
            @RequestParam UUID programId,
            @RequestParam BigDecimal requestedAmount) {
        Map<String, Object> result = eligibilityService.checkPayDayLoanEligibility(
                borrowerId, programId, requestedAmount);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", result));
    }

    @PostMapping("/loans/request")
    public ResponseEntity<Map<String, Object>> requestLoan(@RequestBody Loan loan) {
        Loan created = loanService.requestLoan(loan);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("status", "SUCCESS", "data", created));
    }
}
