package dev.pet.account.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

@Entity
@Table(name = "support_requests")
public class SupportRequest extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @NotBlank
    @Size(max = 200)
    @Column(nullable = false, length = 200)
    private String title;

    @NotBlank
    @Size(max = 4000)
    @Column(nullable = false, length = 4000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private SupportRequestStatus status = SupportRequestStatus.OPEN;

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public SupportRequestStatus getStatus() { return status; }
    public void setStatus(SupportRequestStatus status) { this.status = status; }
}
