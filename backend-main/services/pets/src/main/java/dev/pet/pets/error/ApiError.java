package dev.pet.pets.error;

import java.time.OffsetDateTime;
import java.util.Map;

public class ApiError {
    private String error;
    private String message;
    private OffsetDateTime timestamp = OffsetDateTime.now();
    private Map<String, Object> details;

    public ApiError(String error, String message) {
        this.error = error;
        this.message = message;
    }

    public ApiError(String error, String message, Map<String, Object> details) {
        this.error = error;
        this.message = message;
        this.details = details;
    }

    public String getError() { return error; }
    public String getMessage() { return message; }
    public OffsetDateTime getTimestamp() { return timestamp; }
    public Map<String, Object> getDetails() { return details; }
}
