package com.diplomski.backend.service;

import com.diplomski.backend.entity.AuditLog;
import com.diplomski.backend.entity.RefreshToken;
import com.diplomski.backend.entity.User;
import com.diplomski.backend.repository.AuditLogRepository;
import com.diplomski.backend.repository.RefreshTokenRepository;
import com.diplomski.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class RefreshTokenRotationIntegrationTests {
    @Autowired RefreshTokenRotationService rotation;
    @Autowired RefreshTokenRepository tokens;
    @Autowired UserRepository users;
    @Autowired AuditLogRepository audits;
    private User user;

    @BeforeEach
    void createUser() {
        String suffix = UUID.randomUUID().toString();
        user = users.save(User.builder().username("rotation-" + suffix).email(suffix + "@test.local")
                .password("not-used").role(User.Role.USER).createdAt(LocalDateTime.now()).isActive(true).build());
    }

    @Test
    void activeTokenRotatesWithParentAndFamilyLink() {
        var a = rotation.issueInitial(user);
        var result = rotation.rotate(a.rawToken(), "127.0.0.1");
        RefreshToken storedA = tokens.findById(a.entity().getId()).orElseThrow();
        RefreshToken b = tokens.findById(result.child().entity().getId()).orElseThrow();
        assertEquals(RefreshToken.TokenStatus.ROTATED, storedA.getStatus());
        assertEquals(RefreshToken.TokenStatus.ACTIVE, b.getStatus());
        assertEquals(storedA.getFamilyId(), b.getFamilyId());
        assertEquals(storedA.getId(), b.getParentTokenId());
    }

    @Test
    void reuseMarksOldTokenAndRevokesDescendantWithoutAffectingOtherFamily() {
        var a1 = rotation.issueInitial(user);
        var b1 = rotation.rotate(a1.rawToken(), "127.0.0.1").child();
        var otherFamily = rotation.issueInitial(user);

        assertThrows(RefreshTokenReuseException.class, () -> rotation.rotate(a1.rawToken(), "127.0.0.1"));
        RefreshToken reusedA = tokens.findById(a1.entity().getId()).orElseThrow();
        RefreshToken revokedB = tokens.findById(b1.entity().getId()).orElseThrow();
        RefreshToken unaffected = tokens.findById(otherFamily.entity().getId()).orElseThrow();
        assertEquals(RefreshToken.TokenStatus.REUSED, reusedA.getStatus());
        assertNotNull(reusedA.getReuseDetectedAt());
        assertEquals(RefreshToken.TokenStatus.REVOKED, revokedB.getStatus());
        assertEquals(RefreshToken.TokenStatus.ACTIVE, unaffected.getStatus());
        assertThrows(RefreshTokenReuseException.class, () -> rotation.rotate(b1.rawToken(), "127.0.0.1"));

        List<AuditLog> events = audits.findByUserIdOrderByCreatedAtDesc(user.getId());
        AuditLog reuse = events.stream().filter(e -> "REFRESH_TOKEN_REUSE_DETECTED".equals(e.getAction())).findFirst().orElseThrow();
        assertFalse(reuse.getDetails().contains(a1.rawToken()));
        assertFalse(reuse.getDetails().contains(b1.rawToken()));
    }

    @Test
    void concurrentRefreshHasOneRotationAndOneReuseDetection() throws Exception {
        var a = rotation.issueInitial(user);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        Callable<String> call = () -> {
            ready.countDown(); start.await(5, TimeUnit.SECONDS);
            try { rotation.rotate(a.rawToken(), "127.0.0.1"); return "ROTATED"; }
            catch (RefreshTokenReuseException e) { return "REUSE"; }
        };
        Future<String> first = executor.submit(call);
        Future<String> second = executor.submit(call);
        assertTrue(ready.await(5, TimeUnit.SECONDS)); start.countDown();
        List<String> results = List.of(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS));
        executor.shutdownNow();
        assertEquals(1, results.stream().filter("ROTATED"::equals).count());
        assertEquals(1, results.stream().filter("REUSE"::equals).count());
        List<RefreshToken> family = tokens.findByFamilyIdOrderByCreatedAtAsc(a.entity().getFamilyId());
        assertEquals(2, family.size());
        assertEquals(RefreshToken.TokenStatus.REUSED, family.get(0).getStatus());
        assertEquals(RefreshToken.TokenStatus.REVOKED, family.get(1).getStatus());
    }
}
