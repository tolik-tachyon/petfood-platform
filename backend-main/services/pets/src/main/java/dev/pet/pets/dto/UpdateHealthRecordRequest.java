package dev.pet.pets.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public class UpdateHealthRecordRequest {

    private Long activityTypeId;

    @Size(max = 100)
    private List<Long> symptomIds;

    @Size(max = 2000)
    @JsonAlias("comments")
    private String notes;

    private Double weightKg;

    public Long getActivityTypeId() { return activityTypeId; }
    public void setActivityTypeId(Long activityTypeId) { this.activityTypeId = activityTypeId; }

    public List<Long> getSymptomIds() { return symptomIds; }
    public void setSymptomIds(List<Long> symptomIds) { this.symptomIds = symptomIds; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Double getWeightKg() { return weightKg; }
    public void setWeightKg(Double weightKg) { this.weightKg = weightKg; }
}
