package dev.pet.pets.dto;

import dev.pet.pets.validation.NotFuture;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.UUID;

public class UpdatePetRequest {

    @NotNull
    private Long speciesId;

    @NotNull
    private Long breedId;

    @NotBlank
    @Size(max = 100)
    @Pattern(regexp = "^[\\p{L} ]+$", message = "name must contain only letters and spaces")
    private String name;

    @NotBlank
    @Pattern(regexp = "^(male|female)$", message = "gender must be 'male' or 'female'")
    private String gender;

    @NotNull
    private Long colorId;

    @NotNull
    @NotFuture
    private LocalDate birthDate;

    private String passportId;

    @NotNull
    @Positive(message = "weight must be positive")
    private Double weightKg;

    private Long reproductiveStatusId;

    private Long reproductiveSubStatusId;

    private Integer puppiesCount;

    @Size(max = 512)
    private String photoObjectKey;


    public Integer getPuppiesCount() {
        return puppiesCount;
    }

    public void setPuppiesCount(Integer puppiesCount) {
        this.puppiesCount = puppiesCount;
    }


    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getSpeciesId() {
        return speciesId;
    }

    public void setSpeciesId(Long speciesId) {
        this.speciesId = speciesId;
    }

    public Long getBreedId() {
        return breedId;
    }

    public void setBreedId(Long breedId) {
        this.breedId = breedId;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public Long getColorId() {
        return colorId;
    }

    public void setColorId(Long colorId) {
        this.colorId = colorId;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    public String getPassportId() {
        return passportId;
    }

    public void setPassportId(String passportId) {
        this.passportId = passportId;
    }

    public Double getWeightKg() {
        return weightKg;
    }

    public void setWeightKg(Double weightKg) {
        this.weightKg = weightKg;
    }

    public Long getReproductiveStatusId() {
        return reproductiveStatusId;
    }

    public void setReproductiveStatusId(Long reproductiveStatusId) {
        this.reproductiveStatusId = reproductiveStatusId;
    }

    public Long getReproductiveSubStatusId() {
        return reproductiveSubStatusId;
    }

    public void setReproductiveSubStatusId(Long reproductiveSubStatusId) {
        this.reproductiveSubStatusId = reproductiveSubStatusId;
    }

    public String getPhotoObjectKey() {
        return photoObjectKey;
    }

    public void setPhotoObjectKey(String photoObjectKey) {
        this.photoObjectKey = photoObjectKey;
    }

}
