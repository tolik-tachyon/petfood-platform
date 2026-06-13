package dev.pet.pets.repo;

import dev.pet.pets.domain.PetHealthRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PetHealthRecommendationRepository
    extends JpaRepository<PetHealthRecommendation, UUID> {

    Optional<PetHealthRecommendation> findByHealthRecordId(UUID healthRecordId);
}
