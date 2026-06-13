package dev.pet.auth.api;

import dev.pet.auth.session.SessionService;
import dev.pet.auth.token.TokenService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

record SidExchangeRequest(String sid) {}
record SidExchangeResponse(String token) {}

@RestController
@RequestMapping("/api/v1/auth")
public class SidExchangeController {

    private final SessionService sessions;
    private final TokenService tokens;

    public SidExchangeController(SessionService sessions, TokenService tokens) {
        this.sessions = sessions;
        this.tokens = tokens;
    }

    @PostMapping("/sid/exchange")
    public SidExchangeResponse exchange(@RequestBody SidExchangeRequest req) {
        if (req.sid() == null || req.sid().isBlank())
            throw new SidExchangeException("sid is required");

        var sess = sessions.read(req.sid());
        if (sess == null)
            throw new SidExchangeException("session not found");

        if (!sess.verified())
            throw new SidExchangeException("account not verified");

        String jwt = tokens.issueInternalToken(
            sess.accountId(),
            sess.role() == null ? "" : sess.role()
        );


        return new SidExchangeResponse(jwt);
    }


    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(SidExchangeException.class)
    public String onError(SidExchangeException ex) {
        return ex.getMessage();
    }

    static class SidExchangeException extends RuntimeException {
        SidExchangeException(String m) { super(m); }
    }
}
