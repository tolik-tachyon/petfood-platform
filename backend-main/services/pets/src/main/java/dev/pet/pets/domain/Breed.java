package dev.pet.pets.domain;

import jakarta.persistence.*;

@Entity
@Table(
    name = "breeds",
    schema = "pets",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uq_breeds_species_name",
            columnNames = { "species_id", "name_ru" }
        )
    }
)
public class Breed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(
        name = "species_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "breeds_species_id_fkey")
    )
    private Species species;

    @Column(name = "name_ru", nullable = false, length = 128)
    private String nameRu;

    @Column(name = "name_en", nullable = false, length = 128)
    private String nameEn;

    public Long getId() { return id; }

    public Species getSpecies() { return species; }
    public void setSpecies(Species species) { this.species = species; }

    public String getNameRu() { return nameRu; }
    public void setNameRu(String nameRu) { this.nameRu = nameRu; }

    public String getNameEn() { return nameEn; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }

    public String getName() {
        return nameRu;
    }
}
