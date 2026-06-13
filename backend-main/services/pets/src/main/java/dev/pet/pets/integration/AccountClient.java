package dev.pet.pets.integration;

import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.UUID;

@Component
public class AccountClient {

    private final WebClient accountWebClient;

    public AccountClient(WebClient accountWebClient) {
        this.accountWebClient = accountWebClient;
    }

    public record InternalUserEmailResponse(UUID id, String email, String fullName) {}

    public InternalUserEmailResponse getOwnerEmail(UUID ownerId, String bearerJwt) {
        return accountWebClient.get()
            .uri("/api/v1/account/internal/users/{id}/email", ownerId)
            .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerJwt)
            .retrieve()
            .bodyToMono(InternalUserEmailResponse.class)
            .timeout(Duration.ofSeconds(2))
            .block();
    }
}
