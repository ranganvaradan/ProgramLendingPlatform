package com.plp.iam.controller;

import com.plp.iam.model.dto.AuthResponse;
import com.plp.iam.model.dto.CreateUserRequest;
import com.plp.iam.model.dto.LoginRequest;
import com.plp.iam.model.entity.User;
import com.plp.iam.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody CreateUserRequest request) {
        User user = authService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "status", "SUCCESS",
                "data", Map.of(
                        "userId", user.getId().toString(),
                        "email", user.getEmail(),
                        "role", user.getRole().name()
                )
        ));
    }
}
