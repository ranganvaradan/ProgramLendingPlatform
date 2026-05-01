package com.plp.lending.controller;

import com.plp.lending.model.dto.LoanRequestDTO;
import com.plp.lending.model.entity.Loan;
import com.plp.lending.service.LoanService;
import com.plp.lending.service.kfs.KfsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanService loanService;
    private final KfsService kfsService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> requestLoan(@RequestBody LoanRequestDTO dto) {
        Loan loan = new Loan();
        loan.setBorrowerId(dto.getBorrowerId());
        loan.setProgramId(dto.getProgramId());
        loan.setAnchorId(dto.getAnchorId());
        loan.setProductType(dto.getProductType());
        loan.setRequestedAmount(dto.getRequestedAmount());
        loan.setInterestRate(dto.getInterestRate());
        loan.setTenureDays(dto.getTenureDays());
        loan.setProcessingFee(dto.getProcessingFee());
        loan.setInvoiceId(dto.getInvoiceId());
        loan.setSalaryDataId(dto.getSalaryDataId());
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

    private static final Set<String> ADMIN_ROLES = Set.of("PLATFORM_ADMIN", "PROGRAM_MANAGER", "CREDIT_ANALYST");
    private static final Set<String> DISBURSE_ROLES = Set.of("PLATFORM_ADMIN", "PROGRAM_MANAGER", "TREASURY");

    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approveLoan(
            @PathVariable UUID id,
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader(value = "X-User-Roles", defaultValue = "") String roles,
            @RequestBody(required = false) Map<String, Object> body) {
        requireRole(roles, ADMIN_ROLES, "approve");
        BigDecimal sanctionedAmount = body != null && body.containsKey("sanctionedAmount")
                ? new BigDecimal(body.get("sanctionedAmount").toString()) : null;
        Loan approved = loanService.approveLoan(id, UUID.fromString(userId), sanctionedAmount);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", approved));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> rejectLoan(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Roles", defaultValue = "") String roles,
            @RequestBody Map<String, String> body) {
        requireRole(roles, ADMIN_ROLES, "reject");
        Loan rejected = loanService.rejectLoan(id, body.get("reason"));
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", rejected));
    }

    @PostMapping("/{id}/disburse")
    public ResponseEntity<Map<String, Object>> disburseLoan(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Roles", defaultValue = "") String roles,
            @RequestBody Map<String, Object> body) {
        requireRole(roles, DISBURSE_ROLES, "disburse");
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        Loan disbursed = loanService.markDisbursed(id, amount);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", disbursed));
    }

    private void requireRole(String rolesHeader, Set<String> allowed, String action) {
        if (rolesHeader == null || rolesHeader.isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No roles provided for " + action);
        }
        boolean hasRole = java.util.Arrays.stream(rolesHeader.split(","))
                .map(String::trim)
                .anyMatch(allowed::contains);
        if (!hasRole) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Insufficient role for " + action + ". Required: " + allowed);
        }
    }

    @PostMapping("/{id}/repay")
    public ResponseEntity<Map<String, Object>> recordRepayment(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        Loan updated = loanService.recordRepayment(id, amount);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", updated));
    }

    @GetMapping("/{id}/kfs")
    public ResponseEntity<String> getKfs(@PathVariable UUID id) {
        String html = kfsService.generateKfs(id);
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .header("Content-Disposition", "inline; filename=KFS_" + id + ".html")
                .body(html);
    }

    @GetMapping("/overdue")
    public ResponseEntity<Map<String, Object>> getOverdueLoans() {
        List<Loan> overdue = loanService.getOverdueLoans();
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", overdue));
    }
}
