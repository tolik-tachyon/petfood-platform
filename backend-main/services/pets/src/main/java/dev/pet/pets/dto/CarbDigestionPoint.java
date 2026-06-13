package dev.pet.pets.dto;

public class CarbDigestionPoint {

    private double t;
    private double s;
    private double m;
    private double g;

    public CarbDigestionPoint(double t, double s, double m, double g) {
        this.t = t;
        this.s = s;
        this.m = m;
        this.g = g;
    }

    public double getT() {
        return t;
    }

    public void setT(double t) {
        this.t = t;
    }

    public double getS() {
        return s;
    }

    public void setS(double s) {
        this.s = s;
    }

    public double getM() {
        return m;
    }

    public void setM(double m) {
        this.m = m;
    }

    public double getG() {
        return g;
    }

    public void setG(double g) {
        this.g = g;
    }
}
