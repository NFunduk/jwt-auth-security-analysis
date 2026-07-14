package com.diplomski.backend.controller;

import com.diplomski.backend.service.CsrfDemoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

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
