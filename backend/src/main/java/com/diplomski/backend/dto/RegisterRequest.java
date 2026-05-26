package com.diplomski.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;


@Data
public class RegisterRequest {

    @NotBlank(message = "Username ne sme biti prazan")
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank(message = "Email ne sme biti prazan")
    @Email(message = "Email nije validan")
    private String email;

    @NotBlank(message = "Lozinka ne sme biti prazna")
    @Size(min = 6, message = "Lozinka mora imati najmanje 6 karaktera")
    private String password;
}
