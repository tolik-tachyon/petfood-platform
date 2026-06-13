package dev.pet.auth.api;

import dev.pet.auth.crypto.JwkProvider;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class JwksController {
    private final JwkProvider jwkProvider;

    public JwksController(JwkProvider jwkProvider) {
        this.jwkProvider = jwkProvider;
    }

    @GetMapping(value = "/.well-known/jwks.json", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> jwks() {
        // Отдаём публичный JWKS; Spring/Jackson сам превратит Map в JSON
        return jwkProvider.publicJwkSet().toJSONObject();
    }
}
