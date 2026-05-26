package com.diplomski.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Username ne sme biti prazan")
    private String username;

    @NotBlank(message = "Lozinka ne sme biti prazna")
    private String password;
}