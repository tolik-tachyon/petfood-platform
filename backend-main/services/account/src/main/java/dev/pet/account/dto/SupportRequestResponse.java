package dev.pet.account.dto;

import dev.pet.account.domain.SupportRequestStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record SupportRequestResponse(
    UUID id,
    String title,
    String description,
    SupportRequestStatus status,
    OffsetDateTime createdAt
) {}
