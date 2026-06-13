package dev.pet.pets.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class AccountWebClientConfig {

    @Bean
    public WebClient accountWebClient(@Value("${app.account.base-url}") String baseUrl) {
        return WebClient.builder()
            .baseUrl(baseUrl)
            .build();
    }
}
