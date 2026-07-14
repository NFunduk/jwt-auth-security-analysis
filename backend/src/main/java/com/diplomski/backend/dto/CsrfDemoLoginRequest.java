package com.diplomski.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CsrfDemoLoginRequest {
    @NotBlank
    private String username;
    @NotBlank
    private String password;
}
