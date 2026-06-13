package dev.pet.pets.domain;

import jakarta.persistence.*;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "pet_health_records", schema = "pets")
public class PetHealthRecord {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "pet_id", nullable = false)
    private Pet pet;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @ManyToOne
    @JoinColumn(name = "activity_type_id", nullable = false)
    private ActivityType activityType;

    @ManyToMany
    @JoinTable(
        name = "pet_health_record_symptoms",
        schema = "pets",
        joinColumns = @JoinColumn(name = "pet_health_record_id"),
        inverseJoinColumns = @JoinColumn(name = "symptom_id")
    )
    private Set<Symptom> symptoms;

    @Column(name = "notes")
    private String notes;

    @Column(name = "weight_kg", nullable = false)
    private Double weightKg;

    @Column(name = "created_at", nullable = false)
    private java.time.LocalDateTime createdAt;

    public PetHealthRecord() {
        this.createdAt = java.time.LocalDateTime.now();
        this.weightKg = 0.0;
    }

    public UUID getId() {
        return id;
    }

    public Pet getPet() {
        return pet;
    }

    public void setPet(Pet pet) {
        this.pet = pet;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(UUID ownerId) {
        this.ownerId = ownerId;
    }

    public ActivityType getActivityType() {
        return activityType;
    }

    public void setActivityType(ActivityType activityType) {
        this.activityType = activityType;
    }

    public Set<Symptom> getSymptoms() {
        return symptoms;
    }

    public void setSymptoms(Set<Symptom> symptoms) {
        this.symptoms = symptoms;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Double getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(Double weightKg) {
        this.weightKg = weightKg;
    }

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void assignNewId() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
    }
}
