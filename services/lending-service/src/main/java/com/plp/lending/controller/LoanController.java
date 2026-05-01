package com.plp.lending.controller;

import com.plp.lending.model.entity.Loan;
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
@RequestMapping("/api/v1/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> requestLoan(@RequestBody Loan loan) {
        Loan created = loanService.requestLoan(loan);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("status", "SUCCESS", "data", created));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getLoan(@PathVariable UUID id) {
        Loan loan = loanService.getLoan(id);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", loan));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listLoans(
            @RequestParam(required = false) UUID borrowerId,
            @RequestParam(required = false) UUID programId) {
        List<Loan> loans;
        if (borrowerId != null) {
            loans = loanService.getLoansByBorrower(borrowerId);
        } else if (programId != null) {
            loans = loanService.getLoansByProgram(programId);
        } else {
            loans = loanService.getAllLoans();
        }
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", loans));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveLoan(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") String userId,
            @RequestBody(required = false) Map<String, Object> body) {
        BigDecimal sanctionedAmount = body != null && body.containsKey("sanctionedAmount")
                ? new BigDecimal(body.get("sanctionedAmount").toString()) : null;
        Loan approved = loanService.approveLoan(id, UUID.fromString(userId), sanctionedAmount);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", approved));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectLoan(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        Loan rejected = loanService.rejectLoan(id, body.get("reason"));
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", rejected));
    }

    @PostMapping("/{id}/disburse")
    public ResponseEntity<Map<String, Object>> disburseLoan(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        Loan disbursed = loanService.markDisbursed(id, amount);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", disbursed));
    }

    @PostMapping("/{id}/repay")
    public ResponseEntity<Map<String, Object>> recordRepayment(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        Loan updated = loanService.recordRepayment(id, amount);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", updated));
    }
}
