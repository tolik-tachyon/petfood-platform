package dev.pet.pets.dto;

import java.util.List;

public class ProteinDigestionResponse {

    private double s0;
    private double vmax;
    private double km;
    private double tmax;
    private double dt;
    private List<ProteinDigestionPoint> points;

    public double getS0() {
        return s0;
    }

    public void setS0(double s0) {
        this.s0 = s0;
    }

    public double getVmax() {
        return vmax;
    }

    public void setVmax(double vmax) {
        this.vmax = vmax;
    }

    public double getKm() {
        return km;
    }

    public void setKm(double km) {
        this.km = km;
    }

    public double getTmax() {
        return tmax;
    }

    public void setTmax(double tmax) {
        this.tmax = tmax;
    }

    public double getDt() {
        return dt;
    }

    public void setDt(double dt) {
        this.dt = dt;
    }

    public List<ProteinDigestionPoint> getPoints() {
        return points;
    }

    public void setPoints(List<ProteinDigestionPoint> points) {
        this.points = points;
    }
}
