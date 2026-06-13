package dev.pet.pets.domain;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

@Entity
@Table(
    name = "pets",
    schema = "pets",
    indexes = {
        @Index(name = "ix_pets_owner", columnList = "owner_id"),
        @Index(name = "ix_pets_species", columnList = "species_id"),
        @Index(name = "ix_pets_breed", columnList = "breed_id"),
        @Index(name = "ix_pets_gender", columnList = "gender"),
        @Index(name = "ix_pets_color", columnList = "color_id"),
        @Index(name = "ix_pets_birth", columnList = "birth_date")
    }
)
public class Pet {

    @Id
    @Column(nullable = false)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(
        name = "species_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "pets_species_id_fkey")
    )
    private Species species;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(
        name = "breed_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "pets_breed_id_fkey")
    )
    private Breed breed;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "gender", nullable = false, columnDefinition = "gender")
    private Gender gender;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(
        name = "color_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "pets_color_id_fkey")
    )
    private Color color;

    @Column(name = "passport_id", length = 64)
    private String passportId;

    @Column(name = "weight_kg", nullable = false)
    private Double weightKg;

    @Column(name = "photo_object_key", length = 512)
    private String photoObjectKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "reproductive_status_id",
        foreignKey = @ForeignKey(name = "pets_reproductive_status_id_fkey")
    )
    private ReproductiveStatus reproductiveStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "reproductive_substatus_id",
        foreignKey = @ForeignKey(name = "pets_reproductive_substatus_id_fkey")
    )
    private ReproductiveSubStatus reproductiveSubStatus;


    @Column(name = "puppies_count")
    private Integer puppiesCount;

    public Integer getPuppiesCount() {
        return puppiesCount;
    }

    public void setPuppiesCount(Integer puppiesCount) {
        this.puppiesCount = puppiesCount;
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

    public ReproductiveStatus getReproductiveStatus() {
        return reproductiveStatus;
    }

    public void setReproductiveStatus(ReproductiveStatus reproductiveStatus) {
        this.reproductiveStatus = reproductiveStatus;
    }

    public ReproductiveSubStatus getReproductiveSubStatus() {
        return reproductiveSubStatus;
    }

    public void setReproductiveSubStatus(ReproductiveSubStatus reproductiveSubStatus) {
        this.reproductiveSubStatus = reproductiveSubStatus;
    }


    @Column(name = "birth_date", nullable = false)
    private LocalDate birthDate;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime updatedAt;

    public void assignNewId() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }

    public Species getSpecies() { return species; }
    public void setSpecies(Species species) { this.species = species; }

    public Breed getBreed() { return breed; }
    public void setBreed(Breed breed) { this.breed = breed; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Gender getGender() { return gender; }
    public void setGender(Gender gender) { this.gender = gender; }

    public Color getColor() { return color; }
    public void setColor(Color color) { this.color = color; }

    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }

    public String getPhotoObjectKey() {
        return photoObjectKey;
    }

    public void setPhotoObjectKey(String photoObjectKey) {
        this.photoObjectKey = photoObjectKey;
    }

}
