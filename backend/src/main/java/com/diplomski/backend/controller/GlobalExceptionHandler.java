package com.diplomski.backend.controller;

import com.diplomski.backend.service.CsrfDemoService;
import com.diplomski.backend.service.RefreshTokenRejectedException;
import com.diplomski.backend.service.RefreshTokenReuseException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RefreshTokenReuseException.class)
    public ResponseEntity<Map<String, String>> handleRefreshReuse(RefreshTokenReuseException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(RefreshTokenRejectedException.class)
    public ResponseEntity<Map<String, String>> handleRefreshRejected(RefreshTokenRejectedException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(CsrfDemoService.CsrfRejectedException.class)
    public ResponseEntity<Map<String, String>> handleCsrfRejected(CsrfDemoService.CsrfRejectedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(CsrfDemoService.DemoUnauthorizedException.class)
    public ResponseEntity<Map<String, String>> handleDemoUnauthorized(CsrfDemoService.DemoUnauthorizedException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException e) {
        return ResponseEntity.badRequest()
                .body(Map.of("message", e.getMessage()));
    }
}
