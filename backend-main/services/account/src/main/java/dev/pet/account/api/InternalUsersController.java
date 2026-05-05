package dev.pet.account.api;

import dev.pet.account.domain.User;
import dev.pet.account.dto.InternalUserEmailResponse;
import dev.pet.account.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/account/internal/users")
public class InternalUsersController {

    private final UserRepository users;

    public InternalUsersController(UserRepository users) {
        this.users = users;
    }

    @GetMapping("/{id}/email")
    @PreAuthorize("hasRole('VET') or hasRole('ADMIN') or hasRole('User')")
    public InternalUserEmailResponse getEmailById(@PathVariable UUID id) {
        User u = users.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String fullName = ((u.getFirstName() == null ? "" : u.getFirstName()) + " " +
            (u.getLastName() == null ? "" : u.getLastName())).trim();

        return new InternalUserEmailResponse(u.getId(), u.getEmail(), fullName);
    }
}
