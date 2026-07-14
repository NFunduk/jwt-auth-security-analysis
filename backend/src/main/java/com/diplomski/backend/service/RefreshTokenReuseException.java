package com.diplomski.backend.service;

public class RefreshTokenReuseException extends RuntimeException {
    private final String familyId;

    public RefreshTokenReuseException(String message, String familyId) {
        super(message);
        this.familyId = familyId;
    }

    public String getFamilyId() { return familyId; }
}
