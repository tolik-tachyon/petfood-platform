package dev.pet.pets.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import dev.pet.pets.domain.Species;

public interface SpeciesRepository extends JpaRepository<Species, Long> {
    Optional<Species> findByCode(String code);
}
