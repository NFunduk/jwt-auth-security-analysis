package com.diplomski.backend.service;

import com.diplomski.backend.entity.RefreshToken;
import com.diplomski.backend.repository.RefreshTokenRepository;
import com.diplomski.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RotationLabServiceTests {

    private final UserRepository users = mock(UserRepository.class);
    private final RefreshTokenRepository tokens = mock(RefreshTokenRepository.class);
    private final RefreshTokenRotationService rotation = mock(RefreshTokenRotationService.class);
    private final RotationLabService service = new RotationLabService(users, tokens, rotation);

    @Test
    void familyStatusIsScopedToAuthenticatedUsername() {
        RefreshToken token = RefreshToken.builder().id(1L).status(RefreshToken.TokenStatus.ACTIVE)
                .createdAt(LocalDateTime.now()).build();
        when(tokens.findByFamilyIdAndUserUsernameOrderByCreatedAtAsc("family-1", "alice"))
                .thenReturn(List.of(token));

        var response = service.familyForUser("family-1", "alice");

        assertEquals(1, response.tokens().size());
        verify(tokens).findByFamilyIdAndUserUsernameOrderByCreatedAtAsc("family-1", "alice");
    }

    @Test
    void foreignOrMissingFamilyIsNotDisclosed() {
        when(tokens.findByFamilyIdAndUserUsernameOrderByCreatedAtAsc("family-1", "bob"))
                .thenReturn(List.of());

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.familyForUser("family-1", "bob"));

        assertEquals(404, error.getStatusCode().value());
    }
}
