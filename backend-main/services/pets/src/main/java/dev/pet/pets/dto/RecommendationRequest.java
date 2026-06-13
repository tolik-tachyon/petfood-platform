package dev.pet.pets.dto;

import jakarta.validation.constraints.NotNull;

public class RecommendationRequest {

    @NotNull
    private Object payload;

    public Object getPayload() {
        return payload;
    }

    public void setPayload(Object payload) {
        this.payload = payload;
    }
}
