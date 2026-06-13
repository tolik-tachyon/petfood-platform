package dev.pet.pets.dto;

public class FatDigestionPoint {

    private double t;
    private double l;
    private double e;
    private double d;

    public FatDigestionPoint(double t, double l, double e, double d) {
        this.t = t;
        this.l = l;
        this.e = e;
        this.d = d;
    }

    public double getT() {
        return t;
    }

    public void setT(double t) {
        this.t = t;
    }

    public double getL() {
        return l;
    }

    public void setL(double l) {
        this.l = l;
    }

    public double getE() {
        return e;
    }

    public void setE(double e) {
        this.e = e;
    }

    public double getD() {
        return d;
    }

    public void setD(double d) {
        this.d = d;
    }
}
