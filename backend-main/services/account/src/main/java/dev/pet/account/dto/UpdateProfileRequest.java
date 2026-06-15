package dev.pet.account.dto;

import dev.pet.account.validation.Name;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateProfileRequest(
    @Name String firstName,
    @Name String lastName,
    @Size(max = 32) @Pattern(
        regexp = "^$|^\\+?[1-9]\\d{9,14}$",
        message = "Phone must be 10–15 digits and may start with +"
    )
    String phone,
    @Email String newEmail,
    LocalDate birthDate,
    @Size(max = 100) String country,
    @Size(max = 100) String city
) {}
