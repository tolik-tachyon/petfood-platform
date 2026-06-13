package dev.pet.pets.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public class RecommendationResponse {

    private UUID id;
    private UUID healthRecordId;
    private UUID vetId;
    private LocalDateTime createdAt;
    private Object payload;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getHealthRecordId() {
        return healthRecordId;
    }

    public void setHealthRecordId(UUID healthRecordId) {
        this.healthRecordId = healthRecordId;
    }

    public UUID getVetId() {
        return vetId;
    }

    public void setVetId(UUID vetId) {
        this.vetId = vetId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Object getPayload() {
        return payload;
    }

    public void setPayload(Object payload) {
        this.payload = payload;
    }
}
