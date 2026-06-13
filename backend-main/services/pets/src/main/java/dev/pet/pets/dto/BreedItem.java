package dev.pet.pets.dto;

public class BreedItem {
    private Long id;
    private Long speciesId;
    private String nameRu;
    private String nameEn;

    public BreedItem(Long id, Long speciesId, String nameRu, String nameEn) {
        this.id = id;
        this.speciesId = speciesId;
        this.nameRu = nameRu;
        this.nameEn = nameEn;
    }

    public Long getId() { return id; }
    public Long getSpeciesId() { return speciesId; }
    public String getNameRu() { return nameRu; }
    public String getNameEn() { return nameEn; }
}
