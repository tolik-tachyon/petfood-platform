package dev.pet.pets.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class CarbDigestionRequest {

    @NotNull
    @Positive
    private Double s0;

    @NotNull
    @Positive
    private Double k1;

    @NotNull
    @Positive
    private Double k2;

    @NotNull
    @Positive
    private Double tmax;

    @Positive
    private Double dt;

    public Double getS0() {
        return s0;
    }

    public void setS0(Double s0) {
        this.s0 = s0;
    }

    public Double getK1() {
        return k1;
    }

    public void setK1(Double k1) {
        this.k1 = k1;
    }

    public Double getK2() {
        return k2;
    }

    public void setK2(Double k2) {
        this.k2 = k2;
    }

    public Double getTmax() {
        return tmax;
    }

    public void setTmax(Double tmax) {
        this.tmax = tmax;
    }

    public Double getDt() {
        return dt;
    }

    public void setDt(Double dt) {
        this.dt = dt;
    }
}
