package dev.pet.pets.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class ProteinDigestionRequest {

    @NotNull
    @Positive
    private Double s0;

    @NotNull
    @Positive
    private Double vmax;

    @NotNull
    @Positive
    private Double km;

    @NotNull
    @Positive
    @Max(4)
    private Double tmax;

    @Positive
    @Min(0)
    private Double dt;

    public Double getS0() {
        return s0;
    }

    public void setS0(Double s0) {
        this.s0 = s0;
    }

    public Double getVmax() {
        return vmax;
    }

    public void setVmax(Double vmax) {
        this.vmax = vmax;
    }

    public Double getKm() {
        return km;
    }

    public void setKm(Double km) {
        this.km = km;
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
