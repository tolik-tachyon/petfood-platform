package dev.pet.pets.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.NaturalId;

@Entity
@Table(
    name = "colors",
    schema = "pets"
)
public class Color {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NaturalId
    @Column(nullable = false, unique = true, length = 64)
    private String name;

    public Long getId() { return id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
