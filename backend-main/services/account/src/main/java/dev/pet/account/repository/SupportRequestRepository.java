package dev.pet.account.repository;

import dev.pet.account.domain.SupportRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SupportRequestRepository extends JpaRepository<SupportRequest, UUID> {
    Page<SupportRequest> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
}
