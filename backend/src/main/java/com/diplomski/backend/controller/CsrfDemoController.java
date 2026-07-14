package com.diplomski.backend.controller;

import com.diplomski.backend.dto.CsrfDemoLoginRequest;
import com.diplomski.backend.dto.CsrfDemoSessionResponse;
import com.diplomski.backend.entity.CsrfDemoSession;
import com.diplomski.backend.service.CsrfDemoService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/csrf-demo")
@RequiredArgsConstructor
public class CsrfDemoController {
    public static final String UNSAFE_COOKIE = "csrfDemoUnsafeSession";
    public static final String PROTECTED_COOKIE = "csrfDemoProtectedSession";
    private final CsrfDemoService service;

    @PostMapping("/unsafe/login")
    public ResponseEntity<CsrfDemoSessionResponse> unsafeLogin(@Valid @RequestBody CsrfDemoLoginRequest body, HttpServletRequest request) {
        var result = service.login(body, CsrfDemoSession.Mode.UNSAFE, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie(UNSAFE_COOKIE, result.sessionToken()).toString()).body(result.response());
    }

    @PostMapping("/protected/login")
    public ResponseEntity<CsrfDemoSessionResponse> protectedLogin(@Valid @RequestBody CsrfDemoLoginRequest body, HttpServletRequest request) {
        var result = service.login(body, CsrfDemoSession.Mode.PROTECTED, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie(PROTECTED_COOKIE, result.sessionToken()).toString()).body(result.response());
    }

    /** NAMERNO RANJIV endpoint: autentifikuje samo cookie; nema CSRF ni Origin/Referer proveru. */
    @PostMapping(value = "/unsafe/transfer", consumes = {"application/json", "application/x-www-form-urlencoded", "multipart/form-data"})
    public ResponseEntity<Map<String, Object>> unsafeTransfer(@CookieValue(name = UNSAFE_COOKIE, required = false) String session, HttpServletRequest request) {
        return ResponseEntity.ok(service.unsafeTransfer(session, request.getRemoteAddr(), request.getHeader("User-Agent")));
    }

    @PostMapping("/protected/transfer")
    public ResponseEntity<Map<String, Object>> protectedTransfer(
            @CookieValue(name = PROTECTED_COOKIE, required = false) String session,
            @RequestHeader(name = "X-CSRF-Token", required = false) String csrfToken,
            @RequestHeader(name = "Origin", required = false) String origin,
            @RequestHeader(name = "Referer", required = false) String referer,
            HttpServletRequest request) {
        return ResponseEntity.ok(service.protectedTransfer(session, csrfToken, origin, referer,
                request.getRemoteAddr(), request.getHeader("User-Agent")));
    }

    private ResponseCookie cookie(String name, String value) {
        // Secure=false is only for the controlled local HTTP lab; production requires HTTPS and Secure=true.
        return ResponseCookie.from(name, value).httpOnly(true).secure(false).sameSite("Lax")
                .path("/api/csrf-demo").maxAge(Duration.ofMinutes(30)).build();
    }
}
