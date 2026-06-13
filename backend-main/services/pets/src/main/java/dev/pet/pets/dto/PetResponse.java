package dev.pet.pets.dto;

import java.time.OffsetDateTime;
import java.time.LocalDate;
import java.util.UUID;

public class PetResponse {

    private UUID id;
    private UUID ownerId;

    private Long speciesId;
    private String speciesName;

    private Long breedId;
    private String breedName;

    private String name;
    private String gender;

    private Long colorId;
    private String colorName;

    private LocalDate birthDate;

    private String passportId;
    private Double weightKg;

    private Long reproductiveStatusId;
    private String reproductiveStatusName;

    private Long reproductiveSubStatusId;
    private String reproductiveSubStatusName;

    private Integer puppiesCount;

    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    private String photoObjectKey;



    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }

    public Long getSpeciesId() { return speciesId; }
    public void setSpeciesId(Long speciesId) { this.speciesId = speciesId; }

    public String getSpeciesName() { return speciesName; }
    public void setSpeciesName(String speciesName) { this.speciesName = speciesName; }

    public Long getBreedId() { return breedId; }
    public void setBreedId(Long breedId) { this.breedId = breedId; }

    public String getBreedName() { return breedName; }
    public void setBreedName(String breedName) { this.breedName = breedName; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public Long getColorId() { return colorId; }
    public void setColorId(Long colorId) { this.colorId = colorId; }

    public String getColorName() { return colorName; }
    public void setColorName(String colorName) { this.colorName = colorName; }

    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }

    public String getPassportId() { return passportId; }
    public void setPassportId(String passportId) { this.passportId = passportId; }

    public Double getWeightKg() { return weightKg; }
    public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }

    public Long getReproductiveStatusId() { return reproductiveStatusId; }
    public void setReproductiveStatusId(Long reproductiveStatusId) { this.reproductiveStatusId = reproductiveStatusId; }

    public String getReproductiveStatusName() { return reproductiveStatusName; }
    public void setReproductiveStatusName(String reproductiveStatusName) { this.reproductiveStatusName = reproductiveStatusName; }

    public Long getReproductiveSubStatusId() { return reproductiveSubStatusId; }
    public void setReproductiveSubStatusId(Long reproductiveSubStatusId) { this.reproductiveSubStatusId = reproductiveSubStatusId; }

    public String getReproductiveSubStatusName() { return reproductiveSubStatusName; }
    public void setReproductiveSubStatusName(String reproductiveSubStatusName) { this.reproductiveSubStatusName = reproductiveSubStatusName; }

    public Integer getPuppiesCount() { return puppiesCount; }
    public void setPuppiesCount(Integer puppiesCount) { this.puppiesCount = puppiesCount; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getPhotoObjectKey() {
        return photoObjectKey;
    }

    public void setPhotoObjectKey(String photoObjectKey) {
        this.photoObjectKey = photoObjectKey;
    }

}
