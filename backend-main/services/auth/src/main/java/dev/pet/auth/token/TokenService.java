package dev.pet.auth.token;

import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.*;
import dev.pet.auth.crypto.JwkProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class TokenService {

    private final JwkProvider jwkProvider;
    private final String issuerUrl;
    private final long ttlSeconds;

    public TokenService(
        JwkProvider jwkProvider,
        @Value("${app.jwt.issuer}") String issuer,
        @Value("${app.jwt.ttlSeconds}") long ttlSeconds
    ) {
        this.jwkProvider = jwkProvider;
        this.issuerUrl = normalizeIssuer(issuer);
        this.ttlSeconds = ttlSeconds;
    }

    public String issueInternalToken(String accountId, String role) {
        try {
            var rsaKey = jwkProvider.current();
            var signer = new RSASSASigner(rsaKey.toPrivateKey());

            Instant now = Instant.now();
            Instant exp = now.plusSeconds(ttlSeconds);

            var claims = new JWTClaimsSet.Builder()
                .issuer(issuerUrl)
                .subject(accountId)
                .claim("role", role)
                .issueTime(Date.from(now))
                .expirationTime(Date.from(exp))
                .jwtID(UUID.randomUUID().toString())
                .build();

            var header = new JWSHeader.Builder(JWSAlgorithm.RS256)
                .keyID(rsaKey.getKeyID())
                .type(JOSEObjectType.JWT)
                .build();

            var signed = new SignedJWT(header, claims);
            signed.sign(signer);
            return signed.serialize();
        } catch (Exception e) {
            throw new RuntimeException("Failed to sign internal token", e);
        }
    }


    private static String normalizeIssuer(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("app.jwt.issuer must be set");
        }
        String v = raw.trim();

        if (!v.contains("://")) {
            v = "http://" + v;
        }

        URI uri;
        try {
            uri = URI.create(v);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid issuer URI: " + raw, ex);
        }

        if (!uri.isAbsolute()) {
            throw new IllegalArgumentException("Issuer must be an absolute URL: " + raw);
        }
        String scheme = uri.getScheme();
        if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
            throw new IllegalArgumentException("Issuer scheme must be http or https: " + raw);
        }

        String out = uri.toString();
        while (out.endsWith("/")) out = out.substring(0, out.length() - 1);
        return out;
    }
}
