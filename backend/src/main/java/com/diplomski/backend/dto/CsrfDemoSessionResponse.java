package com.diplomski.backend.dto;

public record CsrfDemoSessionResponse(String username, String csrfToken, String message) {
}
