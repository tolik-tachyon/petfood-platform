package dev.pet.pets.dto;

public class ReproductiveStatusItem {

    private Long id;
    private String code;
    private String name;
    private String gender;
    private boolean requiresSubstatus;

    public ReproductiveStatusItem(
        Long id,
        String code,
        String name,
        String gender,
        boolean requiresSubstatus
    ) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.gender = gender;
        this.requiresSubstatus = requiresSubstatus;
    }

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getGender() {
        return gender;
    }

    public boolean isRequiresSubstatus() {
        return requiresSubstatus;
    }
}
