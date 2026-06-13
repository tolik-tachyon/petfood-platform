package dev.pet.pets.domain;

import jakarta.persistence.*;

import java.util.Set;

@Entity
@Table(name = "symptoms", schema = "pets")
public class Symptom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 128)
    private String name;

    @Column
    private String description;
    @ManyToMany(mappedBy = "symptoms")
    private Set<PetHealthRecord> petHealthRecords;

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
