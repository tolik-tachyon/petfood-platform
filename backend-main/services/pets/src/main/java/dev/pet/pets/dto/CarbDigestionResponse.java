package dev.pet.pets.dto;

import java.util.List;

public class CarbDigestionResponse {

    private double s0;
    private double k1;
    private double k2;
    private double tmax;
    private double dt;
    private List<CarbDigestionPoint> points;

    public double getS0() {
        return s0;
    }

    public void setS0(double s0) {
        this.s0 = s0;
    }

    public double getK1() {
        return k1;
    }

    public void setK1(double k1) {
        this.k1 = k1;
    }

    public double getK2() {
        return k2;
    }

    public void setK2(double k2) {
        this.k2 = k2;
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

    public List<CarbDigestionPoint> getPoints() {
        return points;
    }

    public void setPoints(List<CarbDigestionPoint> points) {
        this.points = points;
    }
}
