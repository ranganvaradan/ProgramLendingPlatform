package com.plp.program.controller;

import com.plp.program.model.entity.Anchor;
import com.plp.program.model.enums.AnchorStatus;
import com.plp.program.repository.AnchorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/anchors")
@RequiredArgsConstructor
public class AnchorController {

    private final AnchorRepository anchorRepository;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createAnchor(@RequestBody Anchor anchor) {
        Anchor created = anchorRepository.save(anchor);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("status", "SUCCESS", "data", created));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listAnchors() {
        List<Anchor> anchors = anchorRepository.findAll();
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", anchors));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getAnchor(@PathVariable UUID id) {
        Anchor anchor = anchorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Anchor not found: " + id));
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", anchor));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateAnchor(@PathVariable UUID id, @RequestBody Anchor updated) {
        Anchor anchor = anchorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Anchor not found: " + id));
        anchor.setEntityName(updated.getEntityName());
        anchor.setContactPersonName(updated.getContactPersonName());
        anchor.setContactEmail(updated.getContactEmail());
        anchor.setContactPhone(updated.getContactPhone());
        anchor.setAddress(updated.getAddress());
        anchor.setBankAccount(updated.getBankAccount());
        anchor.setIntegrationConfig(updated.getIntegrationConfig());
        anchor.setRating(updated.getRating());
        anchorRepository.save(anchor);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", anchor));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        Anchor anchor = anchorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Anchor not found: " + id));
        anchor.setStatus(AnchorStatus.valueOf(body.get("status")));
        anchorRepository.save(anchor);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", anchor));
    }
}
