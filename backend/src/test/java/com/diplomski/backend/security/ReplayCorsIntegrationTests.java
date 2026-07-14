package com.diplomski.backend.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ReplayCorsIntegrationTests {
    @Autowired MockMvc mockMvc;
    @Autowired JwtUtils jwtUtils;

    @Test
    void expiredReplayReturnsReadableCors401ToAttackerOrigin() throws Exception {
        String expired = jwtUtils.generateAccessToken("student", -1_000);
        mockMvc.perform(get("/api/protected/hello")
                        .header("Origin", "http://localhost:5174")
                        .header("Authorization", "Bearer " + expired)
                        .header("X-Replay-Lab", "true"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5174"));
    }
}
