package com.diplomski.backend.controller;

import com.diplomski.backend.dto.AuthResponse;
import com.diplomski.backend.dto.LoginRequest;
import com.diplomski.backend.dto.RegisterRequest;
import com.diplomski.backend.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping("/api/protected/auth")
@RequiredArgsConstructor
public class ProtectedAuthController {

    private static final String REFRESH_COOKIE_NAME = "protectedRefreshToken";
    private static final String REFRESH_COOKIE_PATH = "/api/protected/auth";

    private final AuthService authService;

    @Value("${jwt.refresh-token-expiration}")
    private long refreshTokenExpirationMs;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.protectedRegister(request, httpRequest.getRemoteAddr());
        return withRefreshCookie(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.protectedLogin(request, httpRequest.getRemoteAddr());
        return withRefreshCookie(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.protectedRefresh(refreshToken, httpRequest.getRemoteAddr());
        return withRefreshCookie(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(
            @CookieValue(name = REFRESH_COOKIE_NAME, required = false) String refreshToken,
            HttpServletRequest httpRequest) {
        authService.protectedLogout(refreshToken, httpRequest.getRemoteAddr());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearRefreshCookie().toString())
                .body("Protected refresh cookie obrisan");
    }

    private ResponseEntity<AuthResponse> withRefreshCookie(AuthResponse response) {
        String refreshToken = response.getRefreshToken();
        response.setRefreshToken(null);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie(refreshToken).toString())
                .body(response);
    }

    private ResponseCookie refreshCookie(String refreshToken) {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, refreshToken)
                .httpOnly(true)
                // Secure mora biti true u produkcionom HTTPS okruzenju. False je samo za lokalni HTTP razvoj.
                .secure(false)
                .sameSite("Lax")
                .path(REFRESH_COOKIE_PATH)
                .maxAge(Duration.ofMillis(refreshTokenExpirationMs))
                .build();
    }

    private ResponseCookie clearRefreshCookie() {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(true)
                // Secure mora biti true u produkcionom HTTPS okruzenju. False je samo za lokalni HTTP razvoj.
                .secure(false)
                .sameSite("Lax")
                .path(REFRESH_COOKIE_PATH)
                .maxAge(Duration.ZERO)
                .build();
    }
}
