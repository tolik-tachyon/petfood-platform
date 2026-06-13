package dev.pet.pets.dto;

import java.util.UUID;

public class CreateAuditLogRequest {
    private UUID userId;
    private String eventType;
    private String eventInfo;

    public CreateAuditLogRequest() {}

    public CreateAuditLogRequest(UUID userId, String eventType, String eventInfo) {
        this.userId = userId;
        this.eventType = eventType;
        this.eventInfo = eventInfo;
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getEventInfo() { return eventInfo; }
    public void setEventInfo(String eventInfo) { this.eventInfo = eventInfo; }
}
