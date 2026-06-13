package dev.pet.pets.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class HealthRecordResponse {

    private UUID id;
    private UUID petId;
    private UUID ownerId;
    private String activityTypeName;
    private List<String> symptoms;

    private String createdAt;
    private String petName;
    private Long speciesId;
    private String speciesName;
    private Long breedId;
    private String breedName;
    private String gender;
    private Long colorId;
    private String colorName;
    private LocalDate birthDate;
    private String passportId;
    private Double weightKg;
    private String photoObjectKey;
    private String comments;
    private String ownerName;


    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getPetId() { return petId; }
    public void setPetId(UUID petId) { this.petId = petId; }

    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }

    public String getActivityTypeName() { return activityTypeName; }
    public void setActivityTypeName(String activityTypeName) { this.activityTypeName = activityTypeName; }

    public List<String> getSymptoms() { return symptoms; }
    public void setSymptoms(List<String> symptoms) { this.symptoms = symptoms; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getPetName() { return petName; }
    public void setPetName(String petName) { this.petName = petName; }

    public Long getSpeciesId() { return speciesId; }
    public void setSpeciesId(Long speciesId) { this.speciesId = speciesId; }

    public String getSpeciesName() { return speciesName; }
    public void setSpeciesName(String speciesName) { this.speciesName = speciesName; }

    public Long getBreedId() { return breedId; }
    public void setBreedId(Long breedId) { this.breedId = breedId; }

    public String getBreedName() { return breedName; }
    public void setBreedName(String breedName) { this.breedName = breedName; }

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

    public String getPhotoObjectKey() { return photoObjectKey; }
    public void setPhotoObjectKey(String photoObjectKey) { this.photoObjectKey = photoObjectKey; }

    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }
}
