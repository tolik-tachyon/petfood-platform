package dev.pet.auth.session;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class SessionService {

    private final ValueOperations<String, String> valueOps;
    private final ObjectMapper mapper = new ObjectMapper();

    public SessionService(ValueOperations<String, String> valueOps) {
        this.valueOps = valueOps;
    }

    public record Session(
        String sid,
        String accountId,
        String role,
        boolean verified
    ) {}

    public Session read(String sid) {
        try {
            String raw = valueOps.get(key(sid));
            if (raw == null) return null;
            return mapper.readValue(raw, Session.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to read session", e);
        }
    }

    public void write(Session s, Duration ttl) {
        try {
            valueOps.set(key(s.sid()), mapper.writeValueAsString(s), ttl);
        } catch (Exception e) {
            throw new RuntimeException("Failed to write session", e);
        }
    }

    private String key(String sid) { return "session:" + sid; }
}
