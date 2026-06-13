package dev.pet.pets.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications", schema = "pets")
public class Notification {

    @Id
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @Column(name = "owner_id", nullable = false, columnDefinition = "uuid")
    private UUID ownerId;

    @Column(name = "pet_id", nullable = false, columnDefinition = "uuid")
    private UUID petId;

    @Column(name = "message", nullable = false, columnDefinition = "text")
    private String message;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public UUID getId() { return id; }
    public UUID getOwnerId() { return ownerId; }
    public UUID getPetId() { return petId; }
    public String getMessage() { return message; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }
    public void setPetId(UUID petId) { this.petId = petId; }
    public void setMessage(String message) { this.message = message; }

    public void assignNewId() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
    }
}
