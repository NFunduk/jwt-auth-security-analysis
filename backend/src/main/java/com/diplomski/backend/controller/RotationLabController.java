package com.diplomski.backend.controller;

import com.diplomski.backend.dto.RotationLabRequest;
import com.diplomski.backend.dto.RotationLabResponse;
import com.diplomski.backend.service.RefreshTokenReuseException;
import com.diplomski.backend.service.RotationLabService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rotation-lab")
@RequiredArgsConstructor
public class RotationLabController {
    private final RotationLabService lab;

    @PostMapping("/start")
    public RotationLabResponse start(@AuthenticationPrincipal UserDetails user) {
        return lab.start(user.getUsername());
    }

    @PostMapping("/rotate")
    public ResponseEntity<RotationLabResponse> rotate(@Valid @RequestBody RotationLabRequest body,
                                                       HttpServletRequest request) {
        try {
            return ResponseEntity.ok(lab.rotate(body.refreshToken(), request.getRemoteAddr()));
        } catch (RefreshTokenReuseException reuse) {
            return ResponseEntity.status(409).body(lab.family(reuse.getFamilyId(), "REUSE_DETECTED",
                    "REFRESH_TOKEN_REUSE_DETECTED audit je upisan bez sirove vrednosti tokena"));
        }
    }

    @GetMapping("/family/{familyId}")
    public RotationLabResponse family(@PathVariable String familyId) {
        return lab.family(familyId, "FAMILY_STATUS", null);
    }
}
