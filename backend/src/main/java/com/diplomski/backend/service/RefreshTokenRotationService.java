package com.diplomski.backend.service;

import com.diplomski.backend.entity.AuditLog;
import com.diplomski.backend.entity.RefreshToken;
import com.diplomski.backend.entity.User;
import com.diplomski.backend.repository.AuditLogRepository;
import com.diplomski.backend.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenRotationService {
    private final RefreshTokenRepository tokens;
    private final AuditLogRepository auditLogs;
    @Value("${jwt.refresh-token-expiration}") private long expirationMs;

    @Transactional
    public IssuedToken issueInitial(User user) { return create(user, UUID.randomUUID().toString(), null); }

    @Transactional(noRollbackFor = {RefreshTokenReuseException.class, RefreshTokenRejectedException.class})
    public RotationResult rotate(String rawToken, String ipAddress) {
        RefreshToken current = tokens.findByTokenForUpdate(rawToken)
                .orElseThrow(() -> new RefreshTokenRejectedException("Refresh token nije pronadjen"));
        String family = ensureFamily(current);
        if (current.getStatus() != RefreshToken.TokenStatus.ACTIVE) {
            current.setStatus(RefreshToken.TokenStatus.REUSED);
            current.setReuseDetectedAt(LocalDateTime.now());
            current.setRevokedAt(LocalDateTime.now());
            tokens.save(current);
            int revoked = tokens.revokeActiveFamily(family);
            audit(current.getUser().getId(), "REFRESH_TOKEN_REUSE_DETECTED", ipAddress,
                    "Reuse family " + family + "; opozvano aktivnih naslednika: " + revoked);
            throw new RefreshTokenReuseException("Refresh token reuse detektovan", family);
        }
        if (current.isExpired()) {
            current.setStatus(RefreshToken.TokenStatus.REVOKED);
            current.setRevokedAt(LocalDateTime.now());
            tokens.save(current);
            throw new RefreshTokenRejectedException("Refresh token je istekao");
        }
        current.setStatus(RefreshToken.TokenStatus.ROTATED);
        current.setRevokedAt(LocalDateTime.now());
        tokens.saveAndFlush(current);
        IssuedToken child = create(current.getUser(), family, current.getId());
        audit(current.getUser().getId(), "REFRESH_TOKEN_ROTATED", ipAddress,
                "Family " + family + "; parent " + current.getId() + "; child " + child.entity().getId());
        return new RotationResult(current, child);
    }

    private String ensureFamily(RefreshToken token) {
        if (token.getFamilyId() == null || token.getFamilyId().isBlank()) {
            token.setFamilyId(UUID.randomUUID().toString());
            tokens.saveAndFlush(token);
        }
        return token.getFamilyId();
    }

    private IssuedToken create(User user, String family, Long parentId) {
        String raw = UUID.randomUUID().toString();
        RefreshToken entity = tokens.saveAndFlush(RefreshToken.builder().token(raw).user(user)
                .status(RefreshToken.TokenStatus.ACTIVE).familyId(family).parentTokenId(parentId)
                .createdAt(LocalDateTime.now()).expiresAt(LocalDateTime.now().plusSeconds(expirationMs / 1000)).build());
        return new IssuedToken(raw, entity);
    }

    private void audit(Long userId, String action, String ip, String details) {
        auditLogs.save(AuditLog.builder().userId(userId).action(action).ipAddress(ip)
                .details(details).createdAt(LocalDateTime.now()).build());
    }
    public record IssuedToken(String rawToken, RefreshToken entity) {}
    public record RotationResult(RefreshToken parent, IssuedToken child) {}
}
