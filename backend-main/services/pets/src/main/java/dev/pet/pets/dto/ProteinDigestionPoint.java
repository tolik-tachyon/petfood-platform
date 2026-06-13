package dev.pet.pets.dto;

public class ProteinDigestionPoint {

    private double t;
    private double s;
    private double d;

    public ProteinDigestionPoint(double t, double s, double d) {
        this.t = t;
        this.s = s;
        this.d = d;
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

    public double getD() {
        return d;
    }

    public void setD(double d) {
        this.d = d;
    }
}
