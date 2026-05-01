package com.plp.program.controller;

import com.plp.program.model.entity.Invoice;
import com.plp.program.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping
    public ResponseEntity<Invoice> createInvoice(@RequestBody Invoice invoice) {
        return ResponseEntity.ok(invoiceService.createInvoice(invoice));
    }

    @PostMapping("/upload-csv")
    public ResponseEntity<Map<String, Object>> uploadCsv(
            @RequestParam UUID anchorId,
            @RequestParam UUID programId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) UUID uploadedBy) {
        try {
            List<Invoice> invoices = invoiceService.uploadInvoiceCsv(anchorId, programId, file.getInputStream(), uploadedBy);
            return ResponseEntity.ok(Map.of("status", "success", "rowsInserted", invoices.size()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoice(@PathVariable UUID id) {
        return ResponseEntity.ok(invoiceService.getInvoice(id));
    }

    @GetMapping("/anchor/{anchorId}")
    public ResponseEntity<List<Invoice>> getByAnchor(@PathVariable UUID anchorId) {
        return ResponseEntity.ok(invoiceService.getByAnchor(anchorId));
    }

    @GetMapping("/borrower/{borrowerId}")
    public ResponseEntity<List<Invoice>> getByBorrower(@PathVariable UUID borrowerId) {
        return ResponseEntity.ok(invoiceService.getByBorrower(borrowerId));
    }

    @GetMapping("/borrower/{borrowerId}/eligible")
    public ResponseEntity<List<Invoice>> getEligibleByBorrower(@PathVariable UUID borrowerId) {
        return ResponseEntity.ok(invoiceService.getEligibleByBorrower(borrowerId));
    }

    @GetMapping("/program/{programId}")
    public ResponseEntity<List<Invoice>> getByProgram(@PathVariable UUID programId) {
        return ResponseEntity.ok(invoiceService.getByProgram(programId));
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<Invoice> verifyInvoice(@PathVariable UUID id, @RequestParam UUID verifiedBy) {
        return ResponseEntity.ok(invoiceService.verifyInvoice(id, verifiedBy));
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<Invoice> confirmInvoice(@PathVariable UUID id) {
        return ResponseEntity.ok(invoiceService.confirmInvoice(id));
    }

    @PostMapping("/{id}/mark-discounted")
    public ResponseEntity<Invoice> markDiscounted(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        return ResponseEntity.ok(invoiceService.markDiscounted(id, amount));
    }
}
