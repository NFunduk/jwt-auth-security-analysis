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

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.register(request, httpRequest.getRemoteAddr()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.login(request, httpRequest.getRemoteAddr()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.refresh(request, httpRequest.getRemoteAddr()));
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@Valid @RequestBody RefreshTokenRequest request, HttpServletRequest httpRequest) {
        authService.logout(request, httpRequest.getRemoteAddr());
        return ResponseEntity.ok("Uspesno odjavljen");
    }

    @PostMapping("/login-cookie")
    public ResponseEntity<AuthResponse> loginWithCookie(@Valid @RequestBody LoginRequest request,
                                                         HttpServletRequest httpRequest,
                                                         HttpServletResponse httpServletResponse) {
        AuthResponse response = authService.login(request, httpRequest.getRemoteAddr());
        Cookie cookie = new Cookie("refreshToken", response.getRefreshToken());
        cookie.setHttpOnly(true);
        cookie.setSecure(false);
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60);
        httpServletResponse.addCookie(cookie);
        response.setRefreshToken(null);
        return ResponseEntity.ok(response);
    }
}
