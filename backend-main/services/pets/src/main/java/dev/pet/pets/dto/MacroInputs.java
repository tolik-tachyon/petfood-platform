package dev.pet.pets.dto;

public class MacroInputs {
    private final double proteinS0;
    private final double fatL0;
    private final double carbsS0;

    public MacroInputs(double proteinS0, double fatL0, double carbsS0) {
        this.proteinS0 = proteinS0;
        this.fatL0 = fatL0;
        this.carbsS0 = carbsS0;
    }

    public double getProteinS0() {
        return proteinS0;
    }

    public double getFatL0() {
        return fatL0;
    }

    public double getCarbsS0() {
        return carbsS0;
    }
}
