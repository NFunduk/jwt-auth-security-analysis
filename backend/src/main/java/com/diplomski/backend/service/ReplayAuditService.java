package com.diplomski.backend.service;

import com.diplomski.backend.entity.AuditLog;
import com.diplomski.backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReplayAuditService {
    private final AuditLogRepository auditLogRepository;

    public void succeeded(String username, String ipAddress, String userAgent) {
        save("TOKEN_REPLAY_SUCCEEDED", ipAddress, userAgent,
                "Laboratorijska oznaka: validan Bearer token prihvacen za korisnika " + username);
    }

    public void expired(String ipAddress, String userAgent) {
        save("TOKEN_REPLAY_EXPIRED", ipAddress, userAgent,
                "Laboratorijska oznaka: Bearer token odbijen nakon isteka ili gubitka validnosti");
    }

    private void save(String action, String ipAddress, String userAgent, String details) {
        auditLogRepository.save(AuditLog.builder().action(action).ipAddress(ipAddress)
                .userAgent(userAgent).details(details).createdAt(LocalDateTime.now()).build());
    }
}
