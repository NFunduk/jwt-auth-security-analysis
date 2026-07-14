package com.diplomski.backend.service;

import com.diplomski.backend.dto.CsrfDemoLoginRequest;
import com.diplomski.backend.dto.CsrfDemoSessionResponse;
import com.diplomski.backend.entity.AuditLog;
import com.diplomski.backend.entity.CsrfDemoSession;
import com.diplomski.backend.entity.User;
import com.diplomski.backend.repository.AuditLogRepository;
import com.diplomski.backend.repository.CsrfDemoSessionRepository;
import com.diplomski.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CsrfDemoService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final CsrfDemoSessionRepository sessionRepository;
    private final AuditLogRepository auditLogRepository;

    @Transactional
    public LoginResult login(CsrfDemoLoginRequest request, CsrfDemoSession.Mode mode, String ipAddress, String userAgent) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Korisnik nije pronadjen"));

        String sessionToken = randomToken();
        String csrfToken = mode == CsrfDemoSession.Mode.PROTECTED ? randomToken() : null;
        sessionRepository.save(CsrfDemoSession.builder()
                .sessionHash(hash(sessionToken))
                .csrfTokenHash(csrfToken == null ? null : hash(csrfToken))
                .user(user)
                .mode(mode)
                .transferCount(0)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(30))
                .build());

        audit(user.getId(), "CSRF_DEMO_LOGIN_" + mode, ipAddress, userAgent,
                "Uspostavljena izolovana CSRF demo sesija");
        return new LoginResult(sessionToken,
                new CsrfDemoSessionResponse(user.getUsername(), csrfToken,
                        mode == CsrfDemoSession.Mode.UNSAFE
                                ? "Namerno ranjiva cookie sesija je aktivna"
                                : "Zasticena cookie sesija i sesijski CSRF token su aktivni"));
    }

    @Transactional
    public Map<String, Object> unsafeTransfer(String sessionToken, String ipAddress, String userAgent) {
        CsrfDemoSession session = requireSession(sessionToken, CsrfDemoSession.Mode.UNSAFE);
        session.setTransferCount(session.getTransferCount() + 1);
        audit(session.getUser().getId(), "CSRF_UNSAFE_TRANSFER_SUCCEEDED", ipAddress, userAgent,
                "Transfer prihvacen samo na osnovu automatski poslatog cookie-ja; CSRF zastita nije proverena");
        return transferResponse(session, "UNSAFE transfer je izvrsen bez CSRF provere");
    }

    @Transactional
    public Map<String, Object> protectedTransfer(String sessionToken, String csrfToken,
                                                   String origin, String referer,
                                                   String ipAddress, String userAgent) {
        CsrfDemoSession session = requireSession(sessionToken, CsrfDemoSession.Mode.PROTECTED);
        String rejection = validateOrigin(origin, referer);
        if (rejection == null && (csrfToken == null || !MessageDigest.isEqual(
                hash(csrfToken).getBytes(StandardCharsets.US_ASCII),
                session.getCsrfTokenHash().getBytes(StandardCharsets.US_ASCII)))) {
            rejection = "CSRF token nedostaje ili nije validan";
        }
        if (rejection != null) {
            audit(session.getUser().getId(), "CSRF_PROTECTED_TRANSFER_REJECTED", ipAddress, userAgent, rejection);
            throw new CsrfRejectedException(rejection);
        }

        session.setTransferCount(session.getTransferCount() + 1);
        audit(session.getUser().getId(), "CSRF_PROTECTED_TRANSFER_SUCCEEDED", ipAddress, userAgent,
                "Legitimni zahtev prihvacen: validni Origin i sesijski CSRF token");
        return transferResponse(session, "PROTECTED transfer je izvrsen uz validnu CSRF zastitu");
    }

    private CsrfDemoSession requireSession(String token, CsrfDemoSession.Mode mode) {
        if (token == null || token.isBlank()) throw new DemoUnauthorizedException("Demo session cookie nedostaje");
        CsrfDemoSession session = sessionRepository.findBySessionHash(hash(token))
                .orElseThrow(() -> new DemoUnauthorizedException("Demo session cookie nije validan"));
        if (session.getMode() != mode || session.isExpired())
            throw new DemoUnauthorizedException("Demo sesija nije validna ili je istekla");
        return session;
    }

    private String validateOrigin(String origin, String referer) {
        if ("http://localhost:5173".equals(origin)) return null;
        if (origin != null) return "Origin nije dozvoljen: " + origin;
        if (referer != null && referer.startsWith("http://localhost:5173/")) return null;
        return "Nedostaje dozvoljeni Origin/Referer";
    }

    private Map<String, Object> transferResponse(CsrfDemoSession session, String message) {
        return Map.of("message", message, "username", session.getUser().getUsername(),
                "amount", 100, "transferCount", session.getTransferCount());
    }

    private void audit(Long userId, String action, String ip, String userAgent, String details) {
        auditLogRepository.save(AuditLog.builder().userId(userId).action(action).ipAddress(ip)
                .userAgent(userAgent).details(details).createdAt(LocalDateTime.now()).build());
    }

    private String randomToken() { return UUID.randomUUID() + "." + UUID.randomUUID(); }

    private String hash(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public record LoginResult(String sessionToken, CsrfDemoSessionResponse response) {}
    public static class CsrfRejectedException extends RuntimeException { public CsrfRejectedException(String m) { super(m); } }
    public static class DemoUnauthorizedException extends RuntimeException { public DemoUnauthorizedException(String m) { super(m); } }
}
