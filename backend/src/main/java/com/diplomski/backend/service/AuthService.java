package com.diplomski.backend.service;


import com.diplomski.backend.dto.*;
import com.diplomski.backend.entity.AuditLog;
import com.diplomski.backend.entity.RefreshToken;
import com.diplomski.backend.entity.RefreshToken.TokenStatus;
import com.diplomski.backend.entity.User;
import com.diplomski.backend.repository.AuditLogRepository;
import com.diplomski.backend.repository.RefreshTokenRepository;
import com.diplomski.backend.repository.UserRepository;
import com.diplomski.backend.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;


    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    public AuthResponse register(RegisterRequest request, String ipAddress){
        if(userRepository.existsByUsername(request.getUsername())){
            throw new RuntimeException("Username već postoji");
        }
        if(userRepository.existsByEmail(request.getEmail())){
            throw new RuntimeException("Email već postoji");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.USER)
                .build();

        userRepository.save(user);

        log(user.getId(), "REGISTER", ipAddress, "Novi korinsik registrovan");

        return generateAuthResponse(user, ipAddress);
    }

    public AuthResponse login(LoginRequest request, String ipAddress) {

        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        User user = userRepository.findByUsername(request.getUsername()).orElseThrow(() -> new RuntimeException("Korisnik nije pronađen"));


        refreshTokenRepository.revokeAllUserTokens(user.getId());

        log(user.getId(), "LOGIN", ipAddress, "Uspešna prijava");

        return generateAuthResponse(user, ipAddress);
    }


    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request, String ipAddress) {

        String tokenValue = request.getRefreshToken();

        RefreshToken refreshToken = refreshTokenRepository.findByToken(tokenValue).orElseThrow(() -> new RuntimeException("Refresh token nije pronađen"));

        // Detekcija reuse napada
        if (refreshToken.getStatus() == TokenStatus.ROTATED || refreshToken.getStatus() == TokenStatus.REVOKED) {

            refreshTokenRepository.revokeAllUserTokens(refreshToken.getUser().getId());
            log(refreshToken.getUser().getId(), "REUSE_DETECTED", ipAddress,
                    "Pokušaj ponovne upotrebe refresh tokena, sve sesije poništene");

            throw new RuntimeException("Refresh token reuse detektovan!");
        }

        if (refreshToken.isExpired()) {
            refreshToken.setStatus(TokenStatus.REVOKED);
            refreshTokenRepository.save(refreshToken);
            throw new RuntimeException("Refresh token je istekao");
        }

        refreshToken.setStatus(TokenStatus.ROTATED);
        refreshToken.setRevokedAt(LocalDateTime.now());
        refreshTokenRepository.save(refreshToken);

        log(refreshToken.getUser().getId(), "REFRESH", ipAddress, "Token rotiran");

        return generateAuthResponse(refreshToken.getUser(), ipAddress);
    }

    @Transactional
    public void logout(RefreshTokenRequest request, String ipAddress) {

        refreshTokenRepository.findByToken(request.getRefreshToken())
                .ifPresent(token -> {
                    log(token.getUser().getId(), "LOGOUT", ipAddress, "Korisnik se odjavio");
                    refreshTokenRepository.revokeAllUserTokens(token.getUser().getId());
                });
    }


    private void log(Long userId, String action, String ipAddress, String details) {
        auditLogRepository.save(AuditLog.builder().userId(userId).action(action).ipAddress(ipAddress).details(details).build());
    }

    private AuthResponse generateAuthResponse(User user, String ipAddress) {
        String accessToken = jwtUtils.generateAccessToken(user.getUsername());
        String refreshToken = createRefreshToken(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .tokenType("Bearer")
                .build();
    }

    private String createRefreshToken(User user) {
        String tokenValue = UUID.randomUUID().toString();

        RefreshToken refreshToken = RefreshToken.builder()
                .token(tokenValue)
                .user(user)
                .status(TokenStatus.ACTIVE)
                .expiresAt(LocalDateTime.now().plusSeconds(refreshTokenExpiration / 1000))
                .build();

        refreshTokenRepository.save(refreshToken);
        return tokenValue;
    }


}

