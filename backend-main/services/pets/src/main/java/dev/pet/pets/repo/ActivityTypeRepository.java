package dev.pet.pets.repo;

import dev.pet.pets.domain.ActivityType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivityTypeRepository extends JpaRepository<ActivityType, Long> {
}
