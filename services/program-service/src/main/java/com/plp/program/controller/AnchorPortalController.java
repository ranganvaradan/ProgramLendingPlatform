package com.plp.program.controller;

import com.plp.program.model.entity.Borrower;
import com.plp.program.model.entity.EmployeeSalaryData;
import com.plp.program.model.entity.Invoice;
import com.plp.program.model.entity.Program;
import com.plp.program.repository.BorrowerRepository;
import com.plp.program.repository.ProgramRepository;
import com.plp.program.service.InvoiceService;
import com.plp.program.service.SalaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/portal/anchor")
@RequiredArgsConstructor
public class AnchorPortalController {

    private final BorrowerRepository borrowerRepository;
    private final ProgramRepository programRepository;
    private final SalaryService salaryService;
    private final InvoiceService invoiceService;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard(@RequestHeader("X-User-Id") String userId) {
        // For now, return summary stats. In production, anchor ID would be resolved from user.
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", Map.of(
                "message", "Anchor portal dashboard",
                "userId", userId
        )));
    }

    @GetMapping("/programs")
    public ResponseEntity<Map<String, Object>> getAnchorPrograms(
            @RequestParam UUID anchorId) {
        List<Program> programs = programRepository.findByAnchorId(anchorId);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", programs));
    }

    @GetMapping("/employees")
    public ResponseEntity<Map<String, Object>> getEmployees(
            @RequestParam UUID anchorId,
            @RequestParam(required = false) UUID programId) {
        List<Borrower> employees;
        if (programId != null) {
            employees = borrowerRepository.findByProgramId(programId);
        } else {
            employees = borrowerRepository.findByAnchorId(anchorId);
        }
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", employees));
    }

    @GetMapping("/salary")
    public ResponseEntity<Map<String, Object>> getSalaryData(
            @RequestParam UUID anchorId,
            @RequestParam String payPeriod) {
        List<EmployeeSalaryData> data = salaryService.getByAnchorAndPeriod(anchorId, payPeriod);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", data));
    }

    @PostMapping(value = "/salary/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadSalary(
            @RequestParam UUID anchorId,
            @RequestParam UUID programId,
            @RequestParam String payPeriod,
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        try {
            UUID uploadedBy = userId != null ? UUID.fromString(userId) : null;
            List<EmployeeSalaryData> results = salaryService.uploadSalaryCsv(
                    anchorId, programId, payPeriod, file.getInputStream(), uploadedBy);
            return ResponseEntity.ok(Map.of(
                    "status", "SUCCESS",
                    "data", Map.of("rowsProcessed", results.size(), "records", results)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "ERROR", "message", e.getMessage()));
        }
    }

    // --- Invoice Discounting endpoints ---

    @GetMapping("/invoices")
    public ResponseEntity<Map<String, Object>> getInvoices(
            @RequestParam UUID anchorId,
            @RequestParam(required = false) UUID programId) {
        List<Invoice> invoices;
        if (programId != null) {
            invoices = invoiceService.getByAnchorAndProgram(anchorId, programId);
        } else {
            invoices = invoiceService.getByAnchor(anchorId);
        }
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", invoices));
    }

    @PostMapping("/invoices")
    public ResponseEntity<Map<String, Object>> createInvoice(@RequestBody Invoice invoice) {
        try {
            Invoice created = invoiceService.createInvoice(invoice);
            return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "ERROR", "message", e.getMessage()));
        }
    }

    @PostMapping(value = "/invoices/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadInvoices(
            @RequestParam UUID anchorId,
            @RequestParam UUID programId,
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        try {
            UUID uploadedBy = userId != null ? UUID.fromString(userId) : null;
            List<Invoice> results = invoiceService.uploadInvoiceCsv(anchorId, programId, file.getInputStream(), uploadedBy);
            return ResponseEntity.ok(Map.of(
                    "status", "SUCCESS",
                    "data", Map.of("rowsProcessed", results.size(), "records", results)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "ERROR", "message", e.getMessage()));
        }
    }

    @PostMapping("/invoices/{id}/verify")
    public ResponseEntity<Map<String, Object>> verifyInvoice(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        UUID verifiedBy = userId != null ? UUID.fromString(userId) : null;
        Invoice verified = invoiceService.verifyInvoice(id, verifiedBy);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", verified));
    }

    @PostMapping("/invoices/{id}/confirm")
    public ResponseEntity<Map<String, Object>> confirmInvoice(@PathVariable UUID id) {
        Invoice confirmed = invoiceService.confirmInvoice(id);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", confirmed));
    }
}
