package dev.pet.pets.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import dev.pet.pets.domain.Color;

public interface ColorRepository extends JpaRepository<Color, Long> {
    Optional<Color> findByName(String name);
}
