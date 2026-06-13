package dev.pet.pets.api;

import dev.pet.pets.domain.ActivityType;
import dev.pet.pets.repo.ActivityTypeRepository;
import dev.pet.pets.dto.CreatePetRequest;
import dev.pet.pets.dto.PetFilter;
import dev.pet.pets.dto.PetResponse;
import dev.pet.pets.dto.UpdatePetRequest;
import dev.pet.pets.dto.CreateHealthRecordRequest;
import dev.pet.pets.dto.HealthRecordResponse;
import dev.pet.pets.service.PetService;
import dev.pet.pets.service.DigestionService;
import dev.pet.pets.dto.*;
import dev.pet.pets.domain.Symptom;
import dev.pet.pets.repo.SymptomRepository;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;


import java.util.List;
import java.util.UUID;
import dev.pet.pets.dto.CreatePetPhotoUploadUrlRequest;
import dev.pet.pets.dto.PresignedUrlResponse;

@RestController
@RequestMapping("/api/v1/pets")
public class PetController {

    private final PetService service;
    private final DigestionService digestionService;

    public PetController(PetService service, DigestionService digestionService) {
        this.service = service;
        this.digestionService = digestionService;
    }

    @PostMapping
    public PetResponse create(@AuthenticationPrincipal Jwt jwt,
                              @Valid @RequestBody CreatePetRequest req) {
        System.out.println("JWT Token = " + jwt.getTokenValue());
        System.out.println("JWT Claims = " + jwt.getClaims());
        return service.create(jwt, req);
    }

    @GetMapping("/{id}")
    public PetResponse getOne(@AuthenticationPrincipal Jwt jwt,
                              @PathVariable UUID id) {
        return service.getOne(jwt, id);
    }

    @PatchMapping("/{id}")
    public PetResponse update(@AuthenticationPrincipal Jwt jwt,
                              @PathVariable UUID id,
                              @Valid @RequestBody UpdatePetRequest req) {
        return service.update(jwt, id, req);
    }

    @DeleteMapping("/{id}")
    public void delete(@AuthenticationPrincipal Jwt jwt,
                       @PathVariable UUID id) {
        service.delete(jwt, id);
    }

    @GetMapping("/me")
    public Page<PetResponse> myPets(@AuthenticationPrincipal Jwt jwt,
                                    @RequestParam(required = false) Long speciesId,
                                    @RequestParam(required = false) Long breedId,
                                    @RequestParam(required = false) String gender,
                                    @RequestParam(required = false) Long colorId,
                                    @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "20") int size) {

        PetFilter f = new PetFilter();
        f.setSpeciesId(speciesId);
        f.setBreedId(breedId);
        f.setGender(gender);
        f.setColorId(colorId);

        Pageable pageable = PageRequest.of(page, size);
        return service.listMine(jwt, f, pageable);
    }

    @GetMapping
    public Page<PetResponse> searchAll(@AuthenticationPrincipal Jwt jwt,
                                       @RequestParam(required = false) Long speciesId,
                                       @RequestParam(required = false) Long breedId,
                                       @RequestParam(required = false) String gender,
                                       @RequestParam(required = false) Long colorId,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int size) {

        PetFilter f = new PetFilter();
        f.setSpeciesId(speciesId);
        f.setBreedId(breedId);
        f.setGender(gender);
        f.setColorId(colorId);

        Pageable pageable = PageRequest.of(page, size);
        return service.searchAll(jwt, f, pageable);
    }

    @PostMapping("/{id}/health-records")
    public HealthRecordResponse createHealthRecord (@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID id,
        @Valid @RequestBody CreateHealthRecordRequest req){
        UUID ownerId = UUID.fromString(jwt.getSubject());
        return service.createHealthRecord(jwt, id, ownerId, req);
    }


    @PatchMapping("/{id}/health-records/{healthRecordId}")
    public HealthRecordResponse updateHealthRecord(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID id,
        @PathVariable UUID healthRecordId,
        @Valid @RequestBody dev.pet.pets.dto.UpdateHealthRecordRequest req
    ) {
        UUID ownerId = UUID.fromString(jwt.getSubject());
        return service.updateHealthRecord(jwt, id, healthRecordId, ownerId, req);
    }

    @GetMapping("/{id}/health-records")
    public List<HealthRecordResponse> listHealthRecords (@AuthenticationPrincipal Jwt jwt,
        @PathVariable UUID id){
        UUID ownerId = UUID.fromString(jwt.getSubject());
        return service.listHealthRecords(id, ownerId, jwt);
    }


    @PostMapping("/health-records/{recordId}/recommendation")
    @PreAuthorize("hasRole('VET') or hasRole('USER')")
    public RecommendationResponse createRecommendation(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable("recordId") UUID healthRecordId,
        @Valid @RequestBody RecommendationRequest req
    ) {
        return service.createRecommendation(jwt, healthRecordId, req);
    }

    @GetMapping("/health-records/{recordId}/recommendation")
    public RecommendationResponse getRecommendation(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable("recordId") UUID healthRecordId
    ) {
        return service.getRecommendation(jwt, healthRecordId);
    }

    @PatchMapping("/health-records/{recordId}/recommendation")
    @PreAuthorize("hasRole('VET') or hasRole('USER') ")
    public RecommendationResponse updateRecommendation(
        @AuthenticationPrincipal Jwt jwt,
        @PathVariable("recordId") UUID healthRecordId,
        @Valid @RequestBody RecommendationRequest req
    ) {
        return service.updateRecommendation(jwt, healthRecordId, req);
    }

    @GetMapping("/bio/owners/{ownerId}/pets")
    @PreAuthorize("hasRole('VET')")
    public java.util.List<PetResponse> listOwnerPetsForVet(@PathVariable UUID ownerId) {
        return service.listOwnerPetsForVet(ownerId);
    }


    @PostMapping("/photos/upload-url")
    public PresignedUrlResponse createPhotoUploadUrl(
        @AuthenticationPrincipal Jwt jwt,
        @Valid @RequestBody CreatePetPhotoUploadUrlRequest req
    ) {
        return service.createPhotoUploadUrl(jwt, req);
    }

    @GetMapping("/photos/download-url")
    public PresignedUrlResponse createPhotoDownloadUrl(
        @AuthenticationPrincipal Jwt jwt,
        @RequestParam("objectKey") String objectKey
    ) {
        return service.createPhotoDownloadUrl(jwt, objectKey);
    }


    @GetMapping("/health-records/all")
    @PreAuthorize("hasRole('VET')")
    public List<HealthRecordResponse> listAllHealthRecordsForVet(
        @AuthenticationPrincipal Jwt jwt
    ) {
        return service.listAllHealthRecordsForVet(jwt);
    }

    @GetMapping("/health-records/my")
    public List<HealthRecordResponse> listMyHealthRecords(
        @AuthenticationPrincipal Jwt jwt
    ) {
        UUID ownerId = UUID.fromString(jwt.getSubject());
        return service.listHealthRecordsByOwner(ownerId, jwt);
    }

    @GetMapping("/health-records/{recordId}/protein")
    public ProteinDigestionResponse proteinDigestion(@PathVariable java.util.UUID recordId) {
        return digestionService.simulateProtein(recordId);
    }

    @GetMapping("/health-records/{recordId}/fat")
    public FatDigestionResponse fatDigestion(@PathVariable java.util.UUID recordId) {
        return digestionService.simulateFat(recordId);
    }

    @GetMapping("/health-records/{recordId}/carbs")
    public CarbDigestionResponse carbsDigestion(@PathVariable java.util.UUID recordId) {
        return digestionService.simulateCarbs(recordId);
    }

}

