package com.plp.program.controller;

import com.plp.program.model.entity.EmployeeSalaryData;
import com.plp.program.service.SalaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/salary")
@RequiredArgsConstructor
public class SalaryController {

    private final SalaryService salaryService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadSalaryCsv(
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

    @PostMapping
    public ResponseEntity<Map<String, Object>> createSalaryEntry(@RequestBody EmployeeSalaryData salaryData) {
        EmployeeSalaryData created = salaryService.createOrUpdateSalary(salaryData);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("status", "SUCCESS", "data", created));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listSalaryData(
            @RequestParam(required = false) UUID anchorId,
            @RequestParam(required = false) UUID borrowerId,
            @RequestParam(required = false) String payPeriod) {
        List<EmployeeSalaryData> data;
        if (borrowerId != null) {
            data = salaryService.getByBorrower(borrowerId);
        } else if (anchorId != null && payPeriod != null) {
            data = salaryService.getByAnchorAndPeriod(anchorId, payPeriod);
        } else {
            data = List.of();
        }
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", data));
    }

    @GetMapping("/borrower/{borrowerId}/latest")
    public ResponseEntity<Map<String, Object>> getLatestSalary(@PathVariable UUID borrowerId) {
        return salaryService.getLatestByBorrower(borrowerId)
                .map(d -> ResponseEntity.ok(Map.<String, Object>of("status", "SUCCESS", "data", d)))
                .orElse(ResponseEntity.ok(Map.of("status", "SUCCESS", "data", Map.of())));
    }
}
