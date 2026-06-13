package dev.pet.pets.domain;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "pet_health_recommendations", schema = "pets")
public class PetHealthRecommendation {

    @Id
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "health_record_id", nullable = false)
    private PetHealthRecord healthRecord;

    @Column(name = "vet_id", nullable = false, columnDefinition = "uuid")
    private UUID vetId;

    @Column(name = "payload", nullable = false)
    private String payload;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public UUID getId() {
        return id;
    }

    public PetHealthRecord getHealthRecord() {
        return healthRecord;
    }

    public void setHealthRecord(PetHealthRecord healthRecord) {
        this.healthRecord = healthRecord;
    }

    public UUID getVetId() {
        return vetId;
    }

    public void setVetId(UUID vetId) {
        this.vetId = vetId;
    }

    public String getPayload() {
        return payload;
    }

    public void setPayload(String payload) {
        this.payload = payload;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void assignNewId() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
    }
}
