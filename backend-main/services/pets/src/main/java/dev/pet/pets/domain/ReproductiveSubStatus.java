package dev.pet.pets.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "reproductive_substatuses", schema = "pets")
public class ReproductiveSubStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "status_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "reproductive_substatuses_status_id_fkey")
    )
    private ReproductiveStatus status;

    @Column(nullable = false, length = 128)
    private String name;

    public Long getId() {
        return id;
    }

    public ReproductiveStatus getStatus() {
        return status;
    }

    public void setStatus(ReproductiveStatus status) {
        this.status = status;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
