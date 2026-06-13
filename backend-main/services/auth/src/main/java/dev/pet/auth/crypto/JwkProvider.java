package dev.pet.auth.crypto;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.jwk.*;
import org.springframework.stereotype.Component;
import com.nimbusds.jose.JWSAlgorithm;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.UUID;

@Component
public class JwkProvider {

    private volatile RSAKey currentRsaJwk;

    public JwkProvider() {
        rotate();
    }

    public synchronized void rotate() {
        try {
            KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
            kpg.initialize(2048);
            KeyPair kp = kpg.generateKeyPair();
            RSAPublicKey pub = (RSAPublicKey) kp.getPublic();
            RSAPrivateKey priv = (RSAPrivateKey) kp.getPrivate();

            String kid = UUID.randomUUID().toString();
            this.currentRsaJwk = new RSAKey.Builder(pub)
                .privateKey(priv)
                .keyUse(KeyUse.SIGNATURE)
                .algorithm(JWSAlgorithm.RS256)
                .keyID(kid)
                .issueTime(java.util.Date.from(Instant.now()))
                .build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate RSA key", e);
        }
    }

    public RSAKey current() {
        return currentRsaJwk;
    }

    public JWKSet publicJwkSet() {
        return new JWKSet(currentRsaJwk.toPublicJWK());
    }
}
