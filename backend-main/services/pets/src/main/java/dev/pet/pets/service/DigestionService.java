package dev.pet.pets.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.pet.pets.domain.PetHealthRecommendation;
import dev.pet.pets.dto.*;
import dev.pet.pets.repo.PetHealthRecommendationRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class DigestionService {

    private static final double INTERNAL_DT = 0.01;

    private static final double PROTEIN_VMAX = 0.50;
    private static final double PROTEIN_KM = 0.20;
    private static final double PROTEIN_TMAX = 4.0;

    private static final double FAT_KE = 1.0;
    private static final double FAT_VMAX = 0.50;
    private static final double FAT_KM = 0.20;
    private static final double FAT_TMAX = 4.0;

    private static final double CARB_K1 = 1.0;
    private static final double CARB_K2 = 2.0;
    private static final double CARB_TMAX = 4.0;

    private static final double OUTPUT_DT = 1.0;

    private final PetHealthRecommendationRepository recommendationRepository;
    private final ObjectMapper objectMapper;

    public DigestionService(PetHealthRecommendationRepository recommendationRepository, ObjectMapper objectMapper) {
        this.recommendationRepository = recommendationRepository;
        this.objectMapper = objectMapper;
    }

    public ProteinDigestionResponse simulateProtein(UUID healthRecordId) {
        MacroInputs inputs = extractEverythingByRecordId(healthRecordId);
        double s0 = inputs.getProteinS0();

        if (s0 <= 0) {
            throw new IllegalArgumentException("Initial protein mass (S0) must be > 0");
        }

        double vmax = PROTEIN_VMAX;
        double km = PROTEIN_KM;
        double tMax = PROTEIN_TMAX;
        double outputDt = OUTPUT_DT;

        int steps = (int) Math.round(tMax / INTERNAL_DT);
        if (steps <= 0) steps = 1;

        int outputStride = (int) Math.round(outputDt / INTERNAL_DT);
        if (outputStride <= 0) outputStride = 1;

        double t = 0.0;
        double s = s0;

        List<ProteinDigestionPoint> points = new ArrayList<>();
        points.add(new ProteinDigestionPoint(0.0, s0, 0.0));

        for (int i = 1; i <= steps; i++) {
            double dSdt = -vmax * s / (km + s);
            s = s + dSdt * INTERNAL_DT;
            if (s < 0) s = 0;

            t = i * INTERNAL_DT;
            if (t > tMax) t = tMax;

            if (i % outputStride == 0 || i == steps) {
                double d = 1.0 - (s / s0);
                if (d < 0) d = 0;
                if (d > 1) d = 1;

                double tOut = t;
                if (Math.abs(outputDt - 1.0) < 1e-9) {
                    tOut = Math.round(t);
                }

                points.add(new ProteinDigestionPoint(tOut, s, d));
            }
        }

        ProteinDigestionResponse resp = new ProteinDigestionResponse();
        resp.setS0(s0);
        resp.setVmax(vmax);
        resp.setKm(km);
        resp.setTmax(tMax);
        resp.setDt(outputDt);
        resp.setPoints(points);

        return resp;
    }

    public FatDigestionResponse simulateFat(UUID healthRecordId) {
        MacroInputs inputs = extractEverythingByRecordId(healthRecordId);
        double L0 = inputs.getFatL0();

        if (L0 <= 0) {
            throw new IllegalArgumentException("Initial fat mass (L0) must be > 0");
        }

        double ke = FAT_KE;
        double vmax = FAT_VMAX;
        double km = FAT_KM;
        double tMax = FAT_TMAX;
        double outputDt = OUTPUT_DT;

        int steps = (int) Math.round(tMax / INTERNAL_DT);
        if (steps <= 0) steps = 1;

        int outputStride = (int) Math.round(outputDt / INTERNAL_DT);
        if (outputStride <= 0) outputStride = 1;

        double t = 0.0;
        double L = L0;
        double E = 0.0;

        List<FatDigestionPoint> points = new ArrayList<>();
        points.add(new FatDigestionPoint(0.0, L, E, 0.0));

        for (int i = 1; i <= steps; i++) {
            double dEdt = ke * (L - E);

            double rate;
            if (E <= 1e-9) {
                rate = 0.0;
            } else {
                rate = vmax * E / (km + E);
            }

            double dLdt = -rate;

            E = E + dEdt * INTERNAL_DT;
            if (E < 0) E = 0;
            if (E > L) E = L;

            L = L + dLdt * INTERNAL_DT;
            if (L < 0) L = 0;

            t = i * INTERNAL_DT;
            if (t > tMax) t = tMax;

            if (i % outputStride == 0 || i == steps) {
                double D = 1.0 - (L / L0);
                if (D < 0) D = 0;
                if (D > 1) D = 1;

                double tOut = t;
                if (Math.abs(outputDt - 1.0) < 1e-9) {
                    tOut = Math.round(t);
                }

                points.add(new FatDigestionPoint(tOut, L, E, D));
            }
        }

        FatDigestionResponse resp = new FatDigestionResponse();
        resp.setL0(L0);
        resp.setKe(ke);
        resp.setVmax(vmax);
        resp.setKm(km);
        resp.setTmax(tMax);
        resp.setDt(outputDt);
        resp.setPoints(points);

        return resp;
    }

    public CarbDigestionResponse simulateCarbs(UUID healthRecordId) {
        MacroInputs inputs = extractEverythingByRecordId(healthRecordId);
        double s0 = inputs.getCarbsS0();

        if (s0 <= 0) {
            throw new IllegalArgumentException("Initial carb mass (S0) must be > 0");
        }

        double k1 = CARB_K1;
        double k2 = CARB_K2;
        double tMax = CARB_TMAX;
        double outputDt = OUTPUT_DT;

        int steps = (int) Math.round(tMax / INTERNAL_DT);
        if (steps <= 0) steps = 1;

        int outputStride = (int) Math.round(outputDt / INTERNAL_DT);
        if (outputStride <= 0) outputStride = 1;

        double t = 0.0;
        double S = s0;
        double M = 0.0;
        double G = 0.0;

        List<CarbDigestionPoint> points = new ArrayList<>();
        points.add(new CarbDigestionPoint(0.0, S, M, G));

        for (int i = 1; i <= steps; i++) {
            double dSdt = -k1 * S;
            double dMdt = k1 * S - k2 * M;
            double dGdt = k2 * M;

            S = S + dSdt * INTERNAL_DT;
            if (S < 0) S = 0;

            M = M + dMdt * INTERNAL_DT;
            if (M < 0) M = 0;

            G = G + dGdt * INTERNAL_DT;
            if (G < 0) G = 0;

            t = i * INTERNAL_DT;
            if (t > tMax) t = tMax;

            if (i % outputStride == 0 || i == steps) {
                double tOut = t;
                if (Math.abs(outputDt - 1.0) < 1e-9) {
                    tOut = Math.round(t);
                }
                points.add(new CarbDigestionPoint(tOut, S, M, G));
            }
        }

        CarbDigestionResponse resp = new CarbDigestionResponse();
        resp.setS0(s0);
        resp.setK1(k1);
        resp.setK2(k2);
        resp.setTmax(tMax);
        resp.setDt(outputDt);
        resp.setPoints(points);

        return resp;
    }

    private MacroInputs extractEverythingByRecordId(UUID healthRecordId) {
        PetHealthRecommendation rec = recommendationRepository.findByHealthRecordId(healthRecordId)
            .orElseThrow(() -> new IllegalArgumentException("No recommendation found for healthRecordId=" + healthRecordId));

        return extractEverything(rec.getPayload());
    }

    private MacroInputs extractEverything(String payloadJson) {
        JsonNode root = readJson(payloadJson);

        double protein = findNutrientTotal(root, "Белки");
        double fat = findNutrientTotal(root, "Жиры");
        double carbs = findNutrientTotal(root, "Углеводы");

        if (protein <= 0) protein = findNutrientDeficiencyNumber(root, "Белки");
        if (fat <= 0) fat = findNutrientDeficiencyNumber(root, "Жиры");
        if (carbs <= 0) carbs = findNutrientDeficiencyNumber(root, "Углеводы");

        return new MacroInputs(protein, fat, carbs);
    }

    private JsonNode readJson(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid recommendation payload JSON", e);
        }
    }

    private double findNutrientTotal(JsonNode root, String nutrientName) {
        JsonNode arr = root.path("nutritional_value_total");
        if (!arr.isArray()) return 0.0;

        for (JsonNode item : arr) {
            String n = item.path("nutrient").asText(null);
            if (n == null) continue;

            if (equalsNutrient(n, nutrientName)) {
                JsonNode vNode = item.get("value_per_100g");
                if (vNode == null) return 0.0;

                if (vNode.isNumber()) return vNode.asDouble();
                if (vNode.isTextual()) return parseDoubleLoose(vNode.asText());

                return 0.0;
            }
        }
        return 0.0;
    }

    private double findNutrientDeficiencyNumber(JsonNode root, String nutrientName) {
        JsonNode obj = root.path("nutrient_deficiencies");
        if (!obj.isObject()) return 0.0;

        JsonNode vNode = obj.get(nutrientName);
        if (vNode == null) return 0.0;

        if (vNode.isNumber()) return vNode.asDouble();
        if (vNode.isTextual()) return parseDoubleLoose(vNode.asText());

        return 0.0;
    }

    private boolean equalsNutrient(String actual, String expected) {
        String a = normalize(actual);
        String e = normalize(expected);
        return a.equals(e);
    }

    private String normalize(String s) {
        return s == null ? "" : s.trim().toLowerCase();
    }

    private double parseDoubleLoose(String raw) {
        if (raw == null) return 0.0;
        String cleaned = raw
            .replace(",", ".")
            .replaceAll("[^0-9.\\-]+", "")
            .trim();
        if (cleaned.isEmpty()) return 0.0;
        try {
            return Double.parseDouble(cleaned);
        } catch (Exception e) {
            return 0.0;
        }
    }
}
