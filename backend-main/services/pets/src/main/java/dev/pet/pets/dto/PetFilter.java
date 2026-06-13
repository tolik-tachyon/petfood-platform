package dev.pet.pets.dto;

import org.springframework.util.StringUtils;

public class PetFilter {
    private Long speciesId;
    private Long breedId;
    private String gender;
    private Long colorId;

    public Long getSpeciesId() { return speciesId; }
    public void setSpeciesId(Long speciesId) { this.speciesId = speciesId; }

    public Long getBreedId() { return breedId; }
    public void setBreedId(Long breedId) { this.breedId = breedId; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public Long getColorId() { return colorId; }
    public void setColorId(Long colorId) { this.colorId = colorId; }

    public boolean hasGender() { return StringUtils.hasText(gender); }
}
