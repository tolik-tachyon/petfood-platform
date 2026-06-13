package dev.pet.pets.dto;

import java.util.List;

public class FatDigestionResponse {

    private double l0;
    private double ke;
    private double vmax;
    private double km;
    private double tmax;
    private double dt;
    private List<FatDigestionPoint> points;

    public double getL0() {
        return l0;
    }

    public void setL0(double l0) {
        this.l0 = l0;
    }

    public double getKe() {
        return ke;
    }

    public void setKe(double ke) {
        this.ke = ke;
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

    public List<FatDigestionPoint> getPoints() {
        return points;
    }

    public void setPoints(List<FatDigestionPoint> points) {
        this.points = points;
    }
}
