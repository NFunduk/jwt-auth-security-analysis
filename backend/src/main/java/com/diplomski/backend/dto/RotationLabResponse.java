package com.diplomski.backend.dto;
import java.time.LocalDateTime;
import java.util.List;

public record RotationLabResponse(String familyId, String issuedToken, String event,
                                  List<TokenView> tokens, String auditResult) {
    public record TokenView(Long id, Long parentTokenId, int sequence, String status,
                            LocalDateTime createdAt, LocalDateTime revokedAt, LocalDateTime reuseDetectedAt) {}
}
