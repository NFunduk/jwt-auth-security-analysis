package com.diplomski.backend.service;

import com.diplomski.backend.dto.RotationLabResponse;
import com.diplomski.backend.entity.RefreshToken;
import com.diplomski.backend.entity.User;
import com.diplomski.backend.repository.RefreshTokenRepository;
import com.diplomski.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RotationLabService {
    private final UserRepository users;
    private final RefreshTokenRepository tokens;
    private final RefreshTokenRotationService rotation;

    public RotationLabResponse start(String username) {
        User user = users.findByUsername(username).orElseThrow(() -> new RuntimeException("Korisnik nije pronadjen"));
        var issued = rotation.issueInitial(user);
        return response(issued.entity().getFamilyId(), issued.rawToken(), "TOKEN_A_ISSUED", null);
    }

    public RotationLabResponse rotate(String rawToken, String ipAddress) {
        var result = rotation.rotate(rawToken, ipAddress);
        return response(result.child().entity().getFamilyId(), result.child().rawToken(), "TOKEN_ROTATED", null);
    }

    @Transactional(readOnly = true)
    public RotationLabResponse family(String familyId, String event, String auditResult) {
        return response(familyId, null, event, auditResult);
    }

    private RotationLabResponse response(String familyId, String issued, String event, String auditResult) {
        List<RefreshToken> family = tokens.findByFamilyIdOrderByCreatedAtAsc(familyId);
        List<RotationLabResponse.TokenView> views = java.util.stream.IntStream.range(0, family.size())
                .mapToObj(i -> view(family.get(i), i + 1)).toList();
        return new RotationLabResponse(familyId, issued, event, views, auditResult);
    }

    private RotationLabResponse.TokenView view(RefreshToken token, int sequence) {
        return new RotationLabResponse.TokenView(token.getId(), token.getParentTokenId(), sequence,
                token.getStatus().name(), token.getCreatedAt(), token.getRevokedAt(), token.getReuseDetectedAt());
    }
}
