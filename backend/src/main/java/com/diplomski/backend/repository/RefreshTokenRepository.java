package com.diplomski.backend.repository;

import com.diplomski.backend.entity.RefreshToken;
import com.diplomski.backend.entity.RefreshToken.TokenStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT rt FROM RefreshToken rt JOIN FETCH rt.user WHERE rt.token = :token")
    Optional<RefreshToken> findByTokenForUpdate(String token);
    List<RefreshToken> findByUserIdAndStatus(Long userId, TokenStatus status);
    List<RefreshToken> findByFamilyIdOrderByCreatedAtAsc(String familyId);
    List<RefreshToken> findByFamilyIdAndUserUsernameOrderByCreatedAtAsc(String familyId, String username);

    @Modifying
    @Transactional
    @Query("UPDATE RefreshToken rt SET rt.status = 'REVOKED' WHERE rt.user.id = :userId AND rt.status = 'ACTIVE'")
    void revokeAllUserTokens(Long userId);

    @Modifying
    @Transactional
    @Query("UPDATE RefreshToken rt SET rt.status = 'REVOKED' WHERE rt.token = :token AND rt.status = 'ACTIVE'")
    void revokeToken(String token);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE RefreshToken rt SET rt.status = 'REVOKED', rt.revokedAt = CURRENT_TIMESTAMP " +
            "WHERE rt.familyId = :familyId AND rt.status = 'ACTIVE'")
    int revokeActiveFamily(String familyId);
}
