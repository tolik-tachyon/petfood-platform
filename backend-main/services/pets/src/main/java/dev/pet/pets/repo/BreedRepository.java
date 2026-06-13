package dev.pet.pets.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import dev.pet.pets.domain.Breed;
import dev.pet.pets.domain.Species;
import dev.pet.pets.dto.BreedItem;

public interface BreedRepository extends JpaRepository<Breed, Long> {

    List<Breed> findBySpecies(Species species);

    @Query(
        "select new dev.pet.pets.dto.BreedItem(" +
            "  b.id, " +
            "  b.species.id, " +
            "  b.nameRu, " +
            "  b.nameEn" +
            ") " +
            "from Breed b where b.species = :species"
    )
    List<BreedItem> findItemsBySpecies(Species species);

}
