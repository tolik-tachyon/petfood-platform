package dev.pet.pets.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

@Entity
@Table(name = "reproductive_statuses", schema = "pets")
public class ReproductiveStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "gender", nullable = false, columnDefinition = "gender")
    private Gender gender;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(name = "requires_substatus", nullable = false)
    private boolean requiresSubstatus;

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public Gender getGender() {
        return gender;
    }

    public void setGender(Gender gender) {
        this.gender = gender;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public boolean isRequiresSubstatus() {
        return requiresSubstatus;
    }

    public void setRequiresSubstatus(boolean requiresSubstatus) {
        this.requiresSubstatus = requiresSubstatus;
    }
}
