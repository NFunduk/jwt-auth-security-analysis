package com.diplomski.backend.repository;

import com.diplomski.backend.entity.RefreshToken;
import com.diplomski.backend.entity.RefreshToken.TokenStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    List<RefreshToken> findByUserIdAndStatus(Long userId, TokenStatus status);

    @Modifying
    @Transactional
    @Query("UPDATE RefreshToken rt SET rt.status = 'REVOKED' WHERE rt.user.id = :userId AND rt.status = 'ACTIVE'")
    void revokeAllUserTokens(Long userId);
}