package dev.pet.pets.repo;

import dev.pet.pets.domain.Symptom;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SymptomRepository extends JpaRepository<Symptom, Long> {
}
