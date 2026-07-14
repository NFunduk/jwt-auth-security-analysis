package com.diplomski.backend.repository;

import com.diplomski.backend.entity.CsrfDemoSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CsrfDemoSessionRepository extends JpaRepository<CsrfDemoSession, Long> {
    Optional<CsrfDemoSession> findBySessionHash(String sessionHash);
}
