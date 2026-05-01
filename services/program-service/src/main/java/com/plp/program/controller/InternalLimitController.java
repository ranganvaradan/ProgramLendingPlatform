package com.plp.program.controller;

import com.plp.program.model.entity.BorrowerLimit;
import com.plp.program.service.LimitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

/**
 * Internal-only endpoints for limit block/release.
 * These are called by lending-service via Eureka and NOT routed through the API gateway.
 */
@RestController
@RequestMapping("/internal/v1/borrowers")
@RequiredArgsConstructor
public class InternalLimitController {

    private final LimitService limitService;

    @PostMapping("/{id}/limits/block")
    public ResponseEntity<Map<String, Object>> blockLimit(
            @PathVariable UUID id,
            @RequestParam UUID programId,
            @RequestParam BigDecimal amount) {
        BorrowerLimit limit = limitService.blockLimit(id, programId, amount);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", limit));
    }

    @PostMapping("/{id}/limits/release")
    public ResponseEntity<Map<String, Object>> releaseLimit(
            @PathVariable UUID id,
            @RequestParam UUID programId,
            @RequestParam BigDecimal amount) {
        BorrowerLimit limit = limitService.releaseLimit(id, programId, amount);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", limit));
    }
}
