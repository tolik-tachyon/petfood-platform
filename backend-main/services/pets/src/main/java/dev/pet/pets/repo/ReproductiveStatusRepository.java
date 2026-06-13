package dev.pet.pets.repo;

import dev.pet.pets.domain.Gender;
import dev.pet.pets.domain.ReproductiveStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReproductiveStatusRepository extends JpaRepository<ReproductiveStatus, Long> {
    List<ReproductiveStatus> findByGender(Gender gender);
}
