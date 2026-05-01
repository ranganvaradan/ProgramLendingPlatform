package com.plp.iam.controller;

import com.plp.iam.model.dto.AuthResponse;
import com.plp.iam.model.dto.CreateUserRequest;
import com.plp.iam.model.dto.LoginRequest;
import com.plp.iam.model.entity.User;
import com.plp.iam.model.enums.UserRole;
import com.plp.iam.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    private static final Set<UserRole> SELF_REGISTRABLE_ROLES = Set.of(
            UserRole.BORROWER, UserRole.ANCHOR_ADMIN
    );

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("status", "ERROR", "message", e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
            @Valid @RequestBody CreateUserRequest request,
            @RequestHeader(value = "X-User-Roles", required = false) String callerRoles) {
        if (!SELF_REGISTRABLE_ROLES.contains(request.getRole())) {
            if (callerRoles == null || !callerRoles.contains("PLATFORM_ADMIN")) {
                throw new RuntimeException("Only PLATFORM_ADMIN can assign role: " + request.getRole());
            }
        }
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
