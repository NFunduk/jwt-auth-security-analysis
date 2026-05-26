package com.diplomski.backend.controller;

import com.diplomski.backend.dto.*;
import com.diplomski.backend.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest){
        return ResponseEntity.ok(authService.register(request, httpRequest.getRemoteAddr()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest){
        return ResponseEntity.ok(authService.login(request, httpRequest.getRemoteAddr()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request, HttpServletRequest httpRequest){
        return ResponseEntity.ok(authService.refresh(request, httpRequest.getRemoteAddr()));
    }


    @PostMapping("/logout")
    public ResponseEntity<String> logout(@Valid @RequestBody RefreshTokenRequest request, HttpServletRequest httpRequest){
        authService.logout(request, httpRequest.getRemoteAddr());
        return ResponseEntity.ok("Uspešno odjavljen");
    }

    @PostMapping("/login-cookie")
    public ResponseEntity<AuthResponse> loginWithCookie(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpServletResponse) {

        AuthResponse response = authService.login(request, httpRequest.getRemoteAddr());

        // Čuvaj refresh token u HttpOnly cookie
        Cookie cookie = new Cookie("refreshToken", response.getRefreshToken());
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // true u produkciji
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60);
        httpServletResponse.addCookie(cookie);

        // Ukloni refresh token iz response body-ja
        response.setRefreshToken(null);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/transfer-cookie")
    public ResponseEntity<Map<String, String>> transfer(
            HttpServletRequest request) {

        // Simulacija osetljivog endpointa — npr. prenos novca
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Nije autorizovan"));
        }

        return ResponseEntity.ok(Map.of(
                "message", "Transfer od 1000 EUR je uspešno izvršen!",
                "status", "CSRF napad uspeo — bez zaštite!"
        ));
    }

    @PostMapping("/transfer-protected")
    public ResponseEntity<Map<String, String>> transferProtected(
            @RequestHeader(value = "X-CSRF-Token", required = false) String csrfToken,
            HttpServletRequest request) {

        // Proveri CSRF token
        if (csrfToken == null || !csrfToken.equals("diplomski-csrf-token")) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "CSRF token nedostaje ili je neispravan!"
            ));
        }

        return ResponseEntity.ok(Map.of(
                "message", "Transfer je uspešno izvršen.",
                "status", "Zaštićen endpoint — CSRF zaštita radi!"
        ));
    }
}
