package dev.pet.pets.repo;

import dev.pet.pets.domain.PetHealthRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface PetHealthRecordRepository extends JpaRepository<PetHealthRecord, UUID> {

    @Query("""
        SELECT DISTINCT phr
        FROM PetHealthRecord phr
        LEFT JOIN FETCH phr.symptoms
        WHERE phr.ownerId = :ownerId
    """)
    List<PetHealthRecord> findByOwnerId(UUID ownerId);

    @Query("""
        SELECT DISTINCT phr
        FROM PetHealthRecord phr
        LEFT JOIN FETCH phr.symptoms
        WHERE phr.pet.id = :petId
          AND phr.ownerId = :ownerId
    """)
    List<PetHealthRecord> findByPetIdAndOwnerIdWithSymptoms(UUID petId, UUID ownerId);

    @Query("""
        SELECT DISTINCT phr
        FROM PetHealthRecord phr
        LEFT JOIN FETCH phr.symptoms
    """)
    List<PetHealthRecord> findAllWithSymptoms();
}
