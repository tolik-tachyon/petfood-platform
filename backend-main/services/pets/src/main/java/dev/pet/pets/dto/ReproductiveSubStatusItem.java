package dev.pet.pets.dto;

public class ReproductiveSubStatusItem {

    private Long id;
    private Long statusId;
    private String code;
    private String name;

    public ReproductiveSubStatusItem(
        Long id,
        Long statusId,
        String code,
        String name
    ) {
        this.id = id;
        this.statusId = statusId;
        this.code = code;
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public Long getStatusId() {
        return statusId;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }
}
