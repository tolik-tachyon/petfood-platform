package dev.pet.pets.repo;

import dev.pet.pets.domain.ReproductiveStatus;
import dev.pet.pets.domain.ReproductiveSubStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReproductiveSubStatusRepository extends JpaRepository<ReproductiveSubStatus, Long> {
    List<ReproductiveSubStatus> findByStatus(ReproductiveStatus status);
}
