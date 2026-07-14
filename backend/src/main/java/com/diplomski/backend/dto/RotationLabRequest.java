package com.diplomski.backend.dto;
import jakarta.validation.constraints.NotBlank;
public record RotationLabRequest(@NotBlank String refreshToken) {}
