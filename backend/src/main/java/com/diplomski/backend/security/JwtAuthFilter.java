package com.diplomski.backend.security;


import com.diplomski.backend.service.ReplayAuditService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter{

    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;
    private final ReplayAuditService replayAuditService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException{

        String authHeader = request.getHeader("Authorization");

        if(authHeader == null || !authHeader.startsWith("Bearer ")){
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7); // Uklanja prefiks "Bearer "

        boolean replayLabRequest = "true".equalsIgnoreCase(request.getHeader("X-Replay-Lab"));
        if(jwtUtils.validateToken(token)){
            String username = jwtUtils.getUsernameFromToken(token);

            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authToken);
            if (replayLabRequest) {
                safeReplayAudit(() -> replayAuditService.succeeded(username, request.getRemoteAddr(), request.getHeader("User-Agent")));
            }
        } else if (replayLabRequest) {
            safeReplayAudit(() -> replayAuditService.expired(request.getRemoteAddr(), request.getHeader("User-Agent")));
        }

        filterChain.doFilter(request, response);
    }

    private void safeReplayAudit(Runnable auditAction) {
        try {
            auditAction.run();
        } catch (RuntimeException ignored) {
            // Audit je pomocni laboratorijski signal i nikada ne sme menjati auth ishod.
        }
    }
}
