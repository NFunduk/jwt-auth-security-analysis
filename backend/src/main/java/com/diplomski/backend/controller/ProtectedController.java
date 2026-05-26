package com.diplomski.backend.controller;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/protected")
@SecurityRequirement(name = "bearerAuth")
public class ProtectedController {

    @GetMapping("/hello")
    public ResponseEntity<Map<String, String>> hello(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(Map.of(
                "message", "Zdravo " + userDetails.getUsername() + "!",
                "info", "Ovo je zaštićen endpoint, vidiš ga samo sa validnim tokenom."
        ));
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> profile(@AuthenticationPrincipal UserDetails userDetails){
        return ResponseEntity.ok(Map.of(
                "username", userDetails.getUsername(),
                "roles", userDetails.getAuthorities().toString(),
                "accountActive", userDetails.isEnabled()
        ));
    }
}
