package dev.pet.pets.integration;

import dev.pet.pets.dto.CreateAuditLogRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Component
public class AccountAuditClient {

    private static final Logger log = LoggerFactory.getLogger(AccountAuditClient.class);

    private final WebClient accountWebClient;

    public AccountAuditClient(WebClient accountWebClient) {
        this.accountWebClient = accountWebClient;
    }

    public void writeLog(String bearerToken, CreateAuditLogRequest req) {
        try {
            accountWebClient.post()
                .uri("/api/v1/account/internal/audit/logs")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .retrieve()
                .toBodilessEntity()
                .block();
        }   catch (WebClientResponseException e) {
            log.warn("audit log write failed: status={} body={}",
                e.getStatusCode(), e.getResponseBodyAsString());
        }   catch (Exception e) {
            log.warn("audit log write failed: {}", e.toString());
        }
    }
}
