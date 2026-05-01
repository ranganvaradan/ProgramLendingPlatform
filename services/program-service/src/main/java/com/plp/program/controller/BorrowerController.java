package com.plp.program.controller;

import com.plp.program.model.entity.Borrower;
import com.plp.program.model.entity.BorrowerLimit;
import com.plp.program.repository.BorrowerRepository;
import com.plp.program.service.LimitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/borrowers")
@RequiredArgsConstructor
public class BorrowerController {

    private final BorrowerRepository borrowerRepository;
    private final LimitService limitService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createBorrower(@RequestBody Borrower borrower) {
        Borrower created = borrowerRepository.save(borrower);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("status", "SUCCESS", "data", created));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listBorrowers(
            @RequestParam(required = false) UUID programId,
            @RequestParam(required = false) UUID anchorId) {
        List<Borrower> borrowers;
        if (programId != null) {
            borrowers = borrowerRepository.findByProgramId(programId);
        } else if (anchorId != null) {
            borrowers = borrowerRepository.findByAnchorId(anchorId);
        } else {
            borrowers = borrowerRepository.findAll();
        }
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", borrowers));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getBorrower(@PathVariable UUID id) {
        Borrower borrower = borrowerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Borrower not found: " + id));
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", borrower));
    }

    @GetMapping("/{id}/limits")
    public ResponseEntity<Map<String, Object>> getBorrowerLimits(@PathVariable UUID id) {
        Borrower borrower = borrowerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Borrower not found: " + id));
        BorrowerLimit limit = limitService.getLimit(id, borrower.getProgramId());
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", limit));
    }

    @PostMapping("/{id}/limits")
    public ResponseEntity<Map<String, Object>> assignLimit(
            @PathVariable UUID id,
            @RequestBody Map<String, Object> body) {
        Borrower borrower = borrowerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Borrower not found: " + id));
        UUID programId = body.containsKey("programId")
                ? UUID.fromString(body.get("programId").toString())
                : borrower.getProgramId();
        BigDecimal sanctionedLimit = new BigDecimal(body.get("sanctionedLimit").toString());
        BigDecimal interestRate = body.containsKey("interestRate")
                ? new BigDecimal(body.get("interestRate").toString())
                : null;
        BorrowerLimit limit = limitService.assignLimit(id, programId, sanctionedLimit, interestRate);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("status", "SUCCESS", "data", limit));
    }
}
