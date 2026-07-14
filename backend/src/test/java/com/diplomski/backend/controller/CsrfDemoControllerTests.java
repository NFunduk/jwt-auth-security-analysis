package com.diplomski.backend.controller;

import com.diplomski.backend.dto.CsrfDemoLoginRequest;
import com.diplomski.backend.entity.CsrfDemoSession;
import com.diplomski.backend.entity.User;
import com.diplomski.backend.repository.AuditLogRepository;
import com.diplomski.backend.repository.CsrfDemoSessionRepository;
import com.diplomski.backend.repository.UserRepository;
import com.diplomski.backend.service.CsrfDemoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CsrfDemoControllerTests {
    private MockMvc mockMvc;
    private CsrfDemoService service;
    private final Map<String, CsrfDemoSession> sessions = new HashMap<>();
    private User user;

    @BeforeEach
    void setUp() {
        AuthenticationManager authenticationManager = mock(AuthenticationManager.class);
        UserRepository users = mock(UserRepository.class);
        CsrfDemoSessionRepository sessionRepository = mock(CsrfDemoSessionRepository.class);
        AuditLogRepository audit = mock(AuditLogRepository.class);
        user = User.builder().id(1L).username("student").email("s@example.com").password("hash").role(User.Role.USER).build();
        when(users.findByUsername("student")).thenReturn(Optional.of(user));
        when(sessionRepository.save(any(CsrfDemoSession.class))).thenAnswer(invocation -> {
            CsrfDemoSession saved = invocation.getArgument(0);
            sessions.put(saved.getSessionHash(), saved);
            return saved;
        });
        when(sessionRepository.findBySessionHash(any())).thenAnswer(invocation -> Optional.ofNullable(sessions.get(invocation.getArgument(0))));
        service = new CsrfDemoService(authenticationManager, users, sessionRepository, audit);
        mockMvc = MockMvcBuilders.standaloneSetup(new CsrfDemoController(service))
                .setControllerAdvice(new GlobalExceptionHandler()).build();
    }

    @Test
    void unsafeRequestWithCookiePassesWithoutCsrfToken() throws Exception {
        var login = service.login(credentials(), CsrfDemoSession.Mode.UNSAFE, "127.0.0.1", "test");
        mockMvc.perform(post("/api/csrf-demo/unsafe/transfer")
                        .cookie(new jakarta.servlet.http.Cookie(CsrfDemoController.UNSAFE_COOKIE, login.sessionToken()))
                        .contentType("application/x-www-form-urlencoded").content("amount=100"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.transferCount").value(1));
    }

    @Test
    void protectedRequestWithoutCsrfTokenIsForbidden() throws Exception {
        var login = protectedLogin();
        protectedRequest(login.sessionToken(), null, "http://localhost:5173").andExpect(status().isForbidden());
    }

    @Test
    void protectedRequestWithWrongCsrfTokenIsForbidden() throws Exception {
        var login = protectedLogin();
        protectedRequest(login.sessionToken(), "wrong", "http://localhost:5173").andExpect(status().isForbidden());
    }

    @Test
    void protectedRequestWithValidCookieTokenAndOriginPasses() throws Exception {
        var login = protectedLogin();
        protectedRequest(login.sessionToken(), login.response().csrfToken(), "http://localhost:5173")
                .andExpect(status().isOk()).andExpect(jsonPath("$.transferCount").value(1));
    }

    @Test
    void protectedRequestFromUnapprovedOriginIsForbidden() throws Exception {
        var login = protectedLogin();
        protectedRequest(login.sessionToken(), login.response().csrfToken(), "http://localhost:5174")
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Origin nije dozvoljen: http://localhost:5174"));
    }

    private CsrfDemoService.LoginResult protectedLogin() {
        return service.login(credentials(), CsrfDemoSession.Mode.PROTECTED, "127.0.0.1", "test");
    }

    private CsrfDemoLoginRequest credentials() {
        CsrfDemoLoginRequest request = new CsrfDemoLoginRequest();
        request.setUsername("student"); request.setPassword("password");
        return request;
    }

    private org.springframework.test.web.servlet.ResultActions protectedRequest(String cookie, String token, String origin) throws Exception {
        var request = post("/api/csrf-demo/protected/transfer")
                .cookie(new jakarta.servlet.http.Cookie(CsrfDemoController.PROTECTED_COOKIE, cookie))
                .header("Origin", origin).contentType("application/json").content("{}");
        if (token != null) request.header("X-CSRF-Token", token);
        return mockMvc.perform(request);
    }
}
