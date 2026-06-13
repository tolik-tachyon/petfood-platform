package dev.pet.pets.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.NaturalId;

@Entity
@Table(
    name = "species",
    schema = "pets"
)
public class Species {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NaturalId
    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(name = "name", nullable = false, length = 128)
    private String name;

    public Long getId() { return id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
