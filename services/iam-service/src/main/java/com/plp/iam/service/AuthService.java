package com.plp.iam.service;

import com.plp.iam.model.dto.AuthResponse;
import com.plp.iam.model.dto.CreateUserRequest;
import com.plp.iam.model.dto.LoginRequest;
import com.plp.iam.model.entity.User;
import com.plp.iam.model.enums.UserStatus;
import com.plp.iam.repository.UserRepository;
import com.plp.iam.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid credentials");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new RuntimeException("Account is not active. Status: " + user.getStatus());
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        String accessToken = jwtTokenProvider.generateAccessToken(user);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user);

        log.info("User logged in: {} ({})", user.getEmail(), user.getRole());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(900)
                .userId(user.getId().toString())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }

    @Transactional
    public User createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(request.getRole())
                .linkedEntityId(request.getLinkedEntityId())
                .linkedEntityType(request.getLinkedEntityType())
                .status(UserStatus.ACTIVE)
                .build();

        user = userRepository.save(user);
        log.info("User created: {} ({}) with role {}", user.getEmail(), user.getId(), user.getRole());
        return user;
    }
}
