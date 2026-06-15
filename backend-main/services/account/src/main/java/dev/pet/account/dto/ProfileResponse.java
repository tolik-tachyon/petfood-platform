package dev.pet.account.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ProfileResponse(
    UUID id,
    String email,
    String firstName,
    String lastName,
    String phone,
    LocalDate birthDate,
    String country,
    String city,
    String avatarUrl,
    String role,
    OffsetDateTime createdAt
) { }
