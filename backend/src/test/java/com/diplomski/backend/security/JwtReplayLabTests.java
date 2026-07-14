package com.diplomski.backend.security;

import com.diplomski.backend.entity.AuditLog;
import com.diplomski.backend.repository.AuditLogRepository;
import com.diplomski.backend.service.ReplayAuditService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class JwtReplayLabTests {
    private JwtUtils jwtUtils;
    private ReplayAuditService auditService;
    private UserDetailsService users;
    private HttpServletRequest request;
    private HttpServletResponse response;

    @BeforeEach
    void setUp() {
        jwtUtils = new JwtUtils();
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "test-secret-key-that-is-long-enough-for-hs256-signing");
        ReflectionTestUtils.setField(jwtUtils, "accessTokenExpiration", 900_000L);
        auditService = mock(ReplayAuditService.class);
        users = mock(UserDetailsService.class);
        when(users.loadUserByUsername("student")).thenReturn(new User("student", "password", List.of()));
        request = mock(HttpServletRequest.class);
        response = mock(HttpServletResponse.class);
        when(request.getHeader("X-Replay-Lab")).thenReturn("true");
        when(request.getRemoteAddr()).thenReturn("127.0.0.1");
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void validStolenJwtPassesExistingBearerFilter() throws Exception {
        String token = jwtUtils.generateAccessToken("student", 30_000);
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        FilterChain protectedEndpoint = (req, res) -> ((HttpServletResponse) res).setStatus(
                SecurityContextHolder.getContext().getAuthentication() == null ? 401 : 200);

        new JwtAuthFilter(jwtUtils, users, auditService).doFilterInternal(request, response, protectedEndpoint);

        verify(response).setStatus(200);
        verify(auditService).succeeded("student", "127.0.0.1", null);
    }

    @Test
    void expiredStolenJwtCannotAuthenticateAndReturns401() throws Exception {
        String token = jwtUtils.generateAccessToken("student", -1_000);
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        FilterChain protectedEndpoint = (req, res) -> ((HttpServletResponse) res).setStatus(
                SecurityContextHolder.getContext().getAuthentication() == null ? 401 : 200);

        new JwtAuthFilter(jwtUtils, users, auditService).doFilterInternal(request, response, protectedEndpoint);

        verify(response).setStatus(401);
        verify(auditService).expired("127.0.0.1", null);
        verify(users, never()).loadUserByUsername(any());
    }

    @Test
    void auditFailureDoesNotChangeSuccessfulAuthentication() throws Exception {
        String token = jwtUtils.generateAccessToken("student", 30_000);
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        doThrow(new RuntimeException("audit database unavailable")).when(auditService).succeeded(any(), any(), any());
        FilterChain protectedEndpoint = (req, res) -> ((HttpServletResponse) res).setStatus(
                SecurityContextHolder.getContext().getAuthentication() == null ? 401 : 200);

        new JwtAuthFilter(jwtUtils, users, auditService).doFilterInternal(request, response, protectedEndpoint);

        verify(response).setStatus(200);
    }

    @Test
    void replayAuditServiceStoresExpectedEventWithoutJwt() {
        AuditLogRepository repository = mock(AuditLogRepository.class);
        ReplayAuditService service = new ReplayAuditService(repository);
        service.succeeded("student", "127.0.0.1", "test-agent");
        ArgumentCaptor<AuditLog> event = ArgumentCaptor.forClass(AuditLog.class);
        verify(repository).save(event.capture());
        assertEquals("TOKEN_REPLAY_SUCCEEDED", event.getValue().getAction());
        assertEquals("Laboratorijska oznaka: validan Bearer token prihvacen za korisnika student", event.getValue().getDetails());
    }
}
