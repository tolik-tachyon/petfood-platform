package dev.pet.pets.mapper;

import dev.pet.pets.domain.*;
import dev.pet.pets.dto.CreatePetRequest;
import dev.pet.pets.dto.PetResponse;
import dev.pet.pets.dto.UpdatePetRequest;

public class PetMapper {

    public static void toEntity(CreatePetRequest src,
                                Pet target,
                                Species species,
                                Breed breed,
                                Color color,
                                ReproductiveStatus status,
                                ReproductiveSubStatus subStatus) {

        target.assignNewId();
        target.setSpecies(species);
        target.setBreed(breed);
        target.setName(src.getName().trim());
        target.setGender(Gender.valueOf(src.getGender()));
        target.setColor(color);
        target.setBirthDate(src.getBirthDate());

        target.setPassportId(src.getPassportId());
        target.setWeightKg(src.getWeightKg());
        target.setPhotoObjectKey(src.getPhotoObjectKey());
        target.setReproductiveStatus(status);
        target.setReproductiveSubStatus(subStatus);
        target.setPuppiesCount(src.getPuppiesCount());
    }


    public static void toEntity(UpdatePetRequest src,
                                Pet target,
                                Species species,
                                Breed breed,
                                Color color,
                                ReproductiveStatus status,
                                ReproductiveSubStatus subStatus) {

        target.setSpecies(species);
        target.setBreed(breed);
        target.setName(src.getName().trim());
        target.setGender(Gender.valueOf(src.getGender()));
        target.setColor(color);
        target.setBirthDate(src.getBirthDate());

        target.setPassportId(src.getPassportId());
        target.setWeightKg(src.getWeightKg());

        target.setReproductiveSubStatus(subStatus);
        target.setPuppiesCount(src.getPuppiesCount());

        if (src.getPhotoObjectKey() != null) {
            target.setPhotoObjectKey(src.getPhotoObjectKey());
        };

        target.setReproductiveStatus(status);

    }


    public static PetResponse toDto(Pet p) {
        PetResponse dto = new PetResponse();
        dto.setId(p.getId());
        dto.setOwnerId(p.getOwnerId());

        if (p.getSpecies() != null) {
            dto.setSpeciesId(p.getSpecies().getId());
            dto.setSpeciesName(p.getSpecies().getName());
        }
        if (p.getBreed() != null) {
            dto.setBreedId(p.getBreed().getId());
            dto.setBreedName(p.getBreed().getName());
        }
        if (p.getColor() != null) {
            dto.setColorId(p.getColor().getId());
            dto.setColorName(p.getColor().getName());
        }

        dto.setName(p.getName());
        dto.setGender(p.getGender().name());
        dto.setBirthDate(p.getBirthDate());

        dto.setPassportId(p.getPassportId());
        dto.setWeightKg(p.getWeightKg());
        dto.setPhotoObjectKey(p.getPhotoObjectKey());
        dto.setPuppiesCount(p.getPuppiesCount());

        if (p.getReproductiveStatus() != null) {
            dto.setReproductiveStatusId(p.getReproductiveStatus().getId());
            dto.setReproductiveStatusName(p.getReproductiveStatus().getName());
        }
        if (p.getReproductiveSubStatus() != null) {
            dto.setReproductiveSubStatusId(p.getReproductiveSubStatus().getId());
            dto.setReproductiveSubStatusName(p.getReproductiveSubStatus().getName());
        }

        dto.setCreatedAt(p.getCreatedAt());
        dto.setUpdatedAt(p.getUpdatedAt());

        return dto;
    }



}
