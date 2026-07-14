package com.diplomski.backend.controller;

import com.diplomski.backend.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/replay-lab")
@RequiredArgsConstructor
public class ReplayLabController {
    static final long DEMO_TOKEN_LIFETIME_MS = 30_000;
    private final JwtUtils jwtUtils;

    @PostMapping("/short-lived-token")
    public ResponseEntity<Map<String, Object>> issueShortLivedToken(@AuthenticationPrincipal UserDetails user) {
        String token = jwtUtils.generateAccessToken(user.getUsername(), DEMO_TOKEN_LIFETIME_MS);
        return ResponseEntity.ok(Map.of(
                "accessToken", token,
                "expiresAt", Instant.now().plusMillis(DEMO_TOKEN_LIFETIME_MS).toString(),
                "lifetimeSeconds", DEMO_TOKEN_LIFETIME_MS / 1000
        ));
    }
}
