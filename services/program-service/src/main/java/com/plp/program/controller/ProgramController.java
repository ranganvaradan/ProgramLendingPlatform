package com.plp.program.controller;

import com.plp.program.model.entity.Program;
import com.plp.program.model.enums.ProgramStatus;
import com.plp.program.service.ProgramService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/programs")
@RequiredArgsConstructor
public class ProgramController {

    private final ProgramService programService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createProgram(@RequestBody Program program) {
        Program created = programService.createProgram(program);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("status", "SUCCESS", "data", created));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listPrograms() {
        List<Program> programs = programService.listPrograms();
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", programs));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getProgram(@PathVariable UUID id) {
        Program program = programService.getProgram(id);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", program));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateProgram(@PathVariable UUID id, @RequestBody Program program) {
        Program updated = programService.updateProgram(id, program);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", updated));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        ProgramStatus newStatus = ProgramStatus.valueOf(body.get("status"));
        Program updated = programService.updateStatus(id, newStatus);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", updated));
    }

    @GetMapping("/{id}/utilization")
    public ResponseEntity<Map<String, Object>> getUtilization(@PathVariable UUID id) {
        Map<String, Object> utilization = programService.getUtilization(id);
        return ResponseEntity.ok(Map.of("status", "SUCCESS", "data", utilization));
    }
}
