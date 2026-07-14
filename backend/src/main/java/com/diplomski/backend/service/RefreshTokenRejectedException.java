package com.diplomski.backend.service;
public class RefreshTokenRejectedException extends RuntimeException {
    public RefreshTokenRejectedException(String message) { super(message); }
}
