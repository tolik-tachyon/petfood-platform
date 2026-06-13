package dev.pet.pets.repo;

import dev.pet.pets.domain.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findTop50ByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
}
