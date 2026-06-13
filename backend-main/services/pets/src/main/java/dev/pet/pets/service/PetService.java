package dev.pet.pets.service;

import dev.pet.pets.domain.*;
import dev.pet.pets.domain.PetHealthRecord;
import dev.pet.pets.dto.*;
import dev.pet.pets.repo.ReproductiveStatusRepository;
import dev.pet.pets.messaging.*;
import dev.pet.pets.integration.*;
import dev.pet.pets.repo.ReproductiveSubStatusRepository;
import dev.pet.pets.dto.PetFilter;
import dev.pet.pets.dto.PetResponse;
import dev.pet.pets.dto.UpdatePetRequest;
import dev.pet.pets.dto.CreateHealthRecordRequest;
import dev.pet.pets.dto.HealthRecordResponse;
import dev.pet.pets.error.ForbiddenOperationException;
import dev.pet.pets.error.NotFoundException;
import dev.pet.pets.mapper.PetMapper;
import dev.pet.pets.repo.*;
import dev.pet.pets.integration.AccountAuditClient;
import dev.pet.pets.domain.PetHealthRecommendation;
import dev.pet.pets.dto.RecommendationRequest;
import dev.pet.pets.dto.RecommendationResponse;
import dev.pet.pets.repo.PetHealthRecommendationRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import dev.pet.pets.dto.CreatePetPhotoUploadUrlRequest;
import dev.pet.pets.dto.PresignedUrlResponse;


@Service
public class PetService {

    private final PetRepository pets;
    private final ActivityTypeRepository activityTypeRepo;
    private final SymptomRepository symptomRepo;
    private final SpeciesRepository speciesRepo;
    private final BreedRepository breedRepo;
    private final ColorRepository colorRepo;
    private final PetHealthRecordRepository healthRepo;
    private final ReproductiveStatusRepository reproductiveStatusRepo;
    private final ReproductiveSubStatusRepository reproductiveSubStatusRepo;
    private final PetPhotoStorage photoStorage;

    private final PetHealthRecommendationRepository recommendationRepo;
    private final ObjectMapper objectMapper;
    private final NotificationRepository notificationRepo;
    private final AccountClient accountClient;
    private final EmailProducer emailProducer;
    private final String frontendBaseUrl;
    private final AccountAuditClient auditClient;

    public PetService(
        PetRepository pets,
        SpeciesRepository speciesRepo,
        BreedRepository breedRepo,
        ColorRepository colorRepo,
        ActivityTypeRepository activityTypeRepo,
        SymptomRepository symptomRepo,
        PetHealthRecordRepository healthRepo,
        ReproductiveStatusRepository reproductiveStatusRepo,
        ReproductiveSubStatusRepository reproductiveSubStatusRepo,
        PetPhotoStorage photoStorageService,
        PetHealthRecommendationRepository recommendationRepo,
        ObjectMapper objectMapper,
        NotificationRepository notificationRepo,
        AccountClient accountClient,
        EmailProducer emailProducer,
        AccountAuditClient auditClient,
        @org.springframework.beans.factory.annotation.Value("${app.frontend.base-url}") String frontendBaseUrl
    ) {
        this.pets = pets;
        this.speciesRepo = speciesRepo;
        this.breedRepo = breedRepo;
        this.colorRepo = colorRepo;
        this.activityTypeRepo = activityTypeRepo;
        this.symptomRepo = symptomRepo;
        this.healthRepo = healthRepo;
        this.reproductiveStatusRepo = reproductiveStatusRepo;
        this.reproductiveSubStatusRepo = reproductiveSubStatusRepo;
        this.photoStorage = photoStorageService;
        this.recommendationRepo = recommendationRepo;
        this.objectMapper = objectMapper;
        this.notificationRepo = notificationRepo;
        this.accountClient = accountClient;
        this.emailProducer = emailProducer;
        this.frontendBaseUrl = frontendBaseUrl;
        this.auditClient = auditClient;
    }

    private static final Logger logger = LoggerFactory.getLogger(PetService.class);

    @Transactional
    public PetResponse create(Jwt jwt, CreatePetRequest req) {
        if (jwt == null) {
            logger.error("JWT is null");
        } else {
            logger.debug("JWT Token = {}", jwt.getTokenValue());
            logger.debug("JWT Claims = {}", jwt.getClaims());
        }

        ensureRoleIsOwner(jwt);

        Species species = speciesRepo.findById(req.getSpeciesId())
            .orElseThrow(() -> new NotFoundException("species not found"));

        Breed breed = breedRepo.findById(req.getBreedId())
            .orElseThrow(() -> new NotFoundException("breed not found"));

        if (!breed.getSpecies().getId().equals(species.getId())) {
            throw new ForbiddenOperationException("breed does not belong to species");
        }

        Color color = colorRepo.findById(req.getColorId())
            .orElseThrow(() -> new NotFoundException("color not found"));

        ReproductiveStatus status = null;
        if (req.getReproductiveStatusId() != null) {
            status = reproductiveStatusRepo.findById(req.getReproductiveStatusId())
                .orElseThrow(() -> new NotFoundException("reproductive status not found"));
        }

        ReproductiveSubStatus subStatus = null;
        if (req.getReproductiveSubStatusId() != null) {
            subStatus = reproductiveSubStatusRepo.findById(req.getReproductiveSubStatusId())
                .orElseThrow(() -> new NotFoundException("reproductive substatus not found"));
        }

        Pet pet = new Pet();
        pet.setOwnerId(getSubject(jwt));
        PetMapper.toEntity(req, pet, species, breed, color, status, subStatus);

        Pet saved = pets.save(pet);

        auditClient.writeLog(jwt.getTokenValue(), new dev.pet.pets.dto.CreateAuditLogRequest(
            saved.getOwnerId(),
            "PET_REGISTERED",
            "{\"petId\":\"" + saved.getId() + "\"}"
        ));
        return PetMapper.toDto(saved);
    }



    @Transactional(readOnly = true)
    public PetResponse getOne(Jwt jwt, UUID id) {
        Pet pet = pets.findById(id).orElseThrow(() -> new NotFoundException("pet not found"));
        logger.debug("JWT Token = {}", jwt.getTokenValue());
        logger.debug("JWT Claims = {}", jwt.getClaims());
        if (isAdminOrVet(jwt)) {
            return PetMapper.toDto(pet);
        }
        ensureOwner(jwt, pet.getOwnerId());
        return PetMapper.toDto(pet);
    }

    @Transactional
    public PetResponse update(Jwt jwt, UUID id, UpdatePetRequest req) {
        Pet pet = pets.findById(id).orElseThrow(() -> new NotFoundException("pet not found"));
        ensureOwner(jwt, pet.getOwnerId());

        Species species = speciesRepo.findById(req.getSpeciesId())
            .orElseThrow(() -> new NotFoundException("species not found"));

        Breed breed = breedRepo.findById(req.getBreedId())
            .orElseThrow(() -> new NotFoundException("breed not found"));

        if (!breed.getSpecies().getId().equals(species.getId())) {
            throw new ForbiddenOperationException("breed does not belong to species");
        }

        Color color = colorRepo.findById(req.getColorId())
            .orElseThrow(() -> new NotFoundException("color not found"));

        ReproductiveStatus status = null;
        if (req.getReproductiveStatusId() != null) {
            status = reproductiveStatusRepo.findById(req.getReproductiveStatusId())
                .orElseThrow(() -> new NotFoundException("reproductive status not found"));
        }

        ReproductiveSubStatus subStatus = null;
        if (req.getReproductiveSubStatusId() != null) {
            subStatus = reproductiveSubStatusRepo.findById(req.getReproductiveSubStatusId())
                .orElseThrow(() -> new NotFoundException("reproductive substatus not found"));
        }

        PetMapper.toEntity(req, pet, species, breed, color, status, subStatus);
        Pet saved = pets.save(pet);

        // Create initial health record for newly registered pet
        createInitialHealthRecord(saved, getSubject(jwt));

        auditClient.writeLog(jwt.getTokenValue(), new dev.pet.pets.dto.CreateAuditLogRequest(
            saved.getOwnerId(),
            "PET_UPDATED",
            "{\"petId\":\"" + saved.getId() + "\"}"
        ));
        return PetMapper.toDto(saved);
    }

    @Transactional
    public void delete(Jwt jwt, UUID id) {
        logger.debug("JWT Token = {}", jwt.getTokenValue());
        logger.debug("JWT Claims = {}", jwt.getClaims());
        Pet pet = pets.findById(id).orElseThrow(() -> new NotFoundException("pet not found"));

        ensureOwner(jwt, pet.getOwnerId());
        pets.delete(pet);
    }

    @Transactional(readOnly = true)
    public Page<PetResponse> listMine(Jwt jwt, PetFilter f, Pageable pageable) {
        UUID owner = getSubject(jwt);
        Specification<Pet> spec = Specification.<Pet>where(byOwner(owner))
            .and(bySpecies(f.getSpeciesId()))
            .and(byBreed(f.getBreedId()))
            .and(byGender(f.getGender()))
            .and(byColor(f.getColorId()));
        return pets.findAll(spec, pageable).map(PetMapper::toDto);
    }

    @Transactional(readOnly = true)
    public Page<PetResponse> searchAll(Jwt jwt, PetFilter f, Pageable pageable) {
        requireAdminOrVet(jwt);
        Specification<Pet> spec = Specification.<Pet>where(null)
            .and(bySpecies(f.getSpeciesId()))
            .and(byBreed(f.getBreedId()))
            .and(byGender(f.getGender()))
            .and(byColor(f.getColorId()));
        return pets.findAll(spec, pageable).map(PetMapper::toDto);
    }

    private Specification<Pet> byOwner(UUID ownerId) {
        return (root, cq, cb) -> cb.equal(root.get("ownerId"), ownerId);
    }

    private Specification<Pet> bySpecies(Long id) {
        if (id == null) return null;
        return (root, cq, cb) -> cb.equal(root.get("species").get("id"), id);
    }

    private Specification<Pet> byBreed(Long id) {
        if (id == null) return null;
        return (root, cq, cb) -> cb.equal(root.get("breed").get("id"), id);
    }

    private Specification<Pet> byGender(String g) {
        if (g == null || g.isBlank()) return null;
        Gender gender = Gender.valueOf(g.toLowerCase(Locale.ROOT));
        return (root, cq, cb) -> cb.equal(root.get("gender"), gender);
    }

    private Specification<Pet> byColor(Long id) {
        if (id == null) return null;
        return (root, cq, cb) -> cb.equal(root.get("color").get("id"), id);
    }

    private UUID getSubject(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }

    private void ensureOwner(Jwt jwt, UUID resourceOwner) {
        UUID caller = getSubject(jwt);
        if (!caller.equals(resourceOwner)) {
            throw new ForbiddenOperationException("you can only operate on your own pets");
        }
    }

    private void ensureRoleIsOwner(Jwt jwt) {
        Object claim = jwt.getClaims().get("role");

        if (claim instanceof String s) {
            String role = "ROLE_" + s.toUpperCase(Locale.ROOT);
            if (!role.equals("ROLE_USER")) {
                throw new ForbiddenOperationException("Only owners can perform this operation, not " + role);
            }
        }

        if (claim instanceof java.util.Collection<?> c) {
            boolean validRole = c.stream().anyMatch(o -> {
                if (o instanceof String s) {
                    String role = "ROLE_" + s.toUpperCase(Locale.ROOT);
                    return role.equals("ROLE_USER");
                }
                return false;
            });

            if (!validRole) {
                throw new ForbiddenOperationException("Only owners can perform this operation. Not " + claim);
            }
        }
    }

    private void requireAdminOrVet(Jwt jwt) {
        if (!isAdminOrVet(jwt)) {
            throw new ForbiddenOperationException("admin or veterinarian role required");
        }
    }

    @Transactional
    private void createInitialHealthRecord(Pet pet, UUID ownerId) {
        // Get default/first activity type (usually "Normal" or "Moderate")
        ActivityType defaultActivityType = activityTypeRepo.findAll().stream()
            .findFirst()
            .orElse(null);

        if (defaultActivityType == null) {
            logger.error("CRITICAL: No activity types available for initial health record. Database not properly seeded!");
            throw new IllegalStateException("Activity types not found in database. Application requires reference data initialization.");
        }

        // Get at least one symptom to satisfy the constraint
        Symptom defaultSymptom = symptomRepo.findAll().stream()
            .findFirst()
            .orElse(null);

        if (defaultSymptom == null) {
            logger.error("CRITICAL: No symptoms available for initial health record. Database not properly seeded!");
            throw new IllegalStateException("Symptoms not found in database. Application requires reference data initialization.");
        }

        PetHealthRecord healthRecord = new PetHealthRecord();
        healthRecord.setPet(pet);
        healthRecord.setOwnerId(ownerId);
        healthRecord.setActivityType(defaultActivityType);
        healthRecord.setSymptoms(new HashSet<>());
        healthRecord.getSymptoms().add(defaultSymptom);
        healthRecord.setNotes("Начальная запись при регистрации питомца");
        healthRecord.setWeightKg(pet.getWeightKg() != null ? pet.getWeightKg() : 0.0);
        healthRecord.assignNewId();

        healthRepo.save(healthRecord);
        logger.info("Successfully created initial health record for pet {} with ID {}", pet.getId(), healthRecord.getId());
    }


    private boolean isAdminOrVet(Jwt jwt) {
        Object roleClaim = jwt.getClaims().get("role");
        if (roleClaim == null) {
            return false;
        }

        if (roleClaim instanceof String s) {
            String v = s.toLowerCase(Locale.ROOT);
            return v.contains("admin") || v.contains("vet") || v.contains("veterinarian");
        }

        if (roleClaim instanceof java.util.Collection<?> c) {
            for (Object o : c) {
                if (o instanceof String s) {
                    String v = s.toLowerCase(Locale.ROOT);
                    if (v.contains("admin") || v.contains("vet") || v.contains("veterinarian")) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    @Transactional
    public HealthRecordResponse createHealthRecord(Jwt jwt, UUID petId, UUID ownerId, CreateHealthRecordRequest req) {
        Pet pet = pets.findById(petId)
            .orElseThrow(() -> new NotFoundException("Pet not found"));

        if (!pet.getOwnerId().equals(ownerId)) {
            throw new ForbiddenOperationException("you can only create health records for your own pets");
        }

        ActivityType activityType = activityTypeRepo.findById(req.getActivityTypeId())
            .orElseThrow(() -> new NotFoundException("Activity type not found"));

        List<Symptom> symptoms = symptomRepo.findAllById(req.getSymptomIds());
        if (symptoms.isEmpty()) {
            throw new NotFoundException("No valid symptoms found");
        }

        PetHealthRecord healthRecord = new PetHealthRecord();
        healthRecord.setPet(pet);
        healthRecord.setOwnerId(ownerId);
        healthRecord.setActivityType(activityType);
        healthRecord.setSymptoms(new HashSet<>(symptoms));
        healthRecord.setNotes(req.getNotes());

        Double recordWeight = req.getWeightKg() != null ? req.getWeightKg() : pet.getWeightKg();
        healthRecord.setWeightKg(recordWeight);

        if (req.getWeightKg() != null && !req.getWeightKg().equals(pet.getWeightKg())) {
            pet.setWeightKg(req.getWeightKg());
            pets.save(pet);
        }

        healthRecord.assignNewId();

        PetHealthRecord savedRecord = healthRepo.save(healthRecord);

        auditClient.writeLog(jwt.getTokenValue(), new CreateAuditLogRequest(
            ownerId,
            "HEALTH_RECORD_CREATED",
            "{\"petId\":\"" + petId + "\",\"healthRecordId\":\"" + savedRecord.getId() + "\"}"
        ));

        return toHealthDto(savedRecord, resolveOwnerName(ownerId, jwt));
    }


    @Transactional
    public HealthRecordResponse updateHealthRecord(
        Jwt jwt,
        UUID petId,
        UUID healthRecordId,
        UUID ownerId,
        UpdateHealthRecordRequest req
    ) {
        Pet pet = pets.findById(petId)
            .orElseThrow(() -> new NotFoundException("Pet not found"));

        if (!pet.getOwnerId().equals(ownerId)) {
            throw new ForbiddenOperationException("you can only update health records for your own pets");
        }

        PetHealthRecord record = healthRepo.findById(healthRecordId)
            .orElseThrow(() -> new NotFoundException("Health record not found"));

        if (record.getPet() == null || record.getPet().getId() == null || !record.getPet().getId().equals(petId)) {
            throw new ForbiddenOperationException("health record does not belong to this pet");
        }

        if (req.getActivityTypeId() != null) {
            ActivityType activityType = activityTypeRepo.findById(req.getActivityTypeId())
                .orElseThrow(() -> new NotFoundException("Activity type not found"));
            record.setActivityType(activityType);
        }

        if (req.getSymptomIds() != null) {
            List<Symptom> symptoms = symptomRepo.findAllById(req.getSymptomIds());
            if (symptoms.isEmpty()) {
                throw new NotFoundException("No valid symptoms found");
            }
            record.setSymptoms(new java.util.HashSet<>(symptoms));
        }

        if (req.getNotes() != null) {
            record.setNotes(req.getNotes());
        }

        if (req.getWeightKg() != null) {
            record.setWeightKg(req.getWeightKg());

            if (pet.getWeightKg() == null || !req.getWeightKg().equals(pet.getWeightKg())) {
                pet.setWeightKg(req.getWeightKg());
                pets.save(pet);
            }
        }

        PetHealthRecord saved = healthRepo.save(record);

        auditClient.writeLog(jwt.getTokenValue(), new dev.pet.pets.dto.CreateAuditLogRequest(
            ownerId,
            "HEALTH_RECORD_UPDATED",
            "{\"petId\":\"" + petId + "\",\"healthRecordId\":\"" + saved.getId() + "\"}"
        ));

        return toHealthDto(saved, resolveOwnerName(ownerId, jwt));
    }

    private HealthRecordResponse toHealthDto(PetHealthRecord record) {
        return toHealthDto(record, null);
    }

    private HealthRecordResponse toHealthDto(PetHealthRecord record, String ownerName) {
        HealthRecordResponse response = new HealthRecordResponse();

        Pet pet = record.getPet();

        response.setId(record.getId());
        response.setPetId(pet.getId());
        response.setOwnerId(record.getOwnerId());
        response.setActivityTypeName(record.getActivityType().getName());

        response.setSymptoms(
            record.getSymptoms()
                .stream()
                .map(Symptom::getName)
                .toList()
        );

        response.setCreatedAt(record.getCreatedAt().toString());
        response.setPetName(pet.getName());
        response.setSpeciesId(pet.getSpecies().getId());
        response.setSpeciesName(pet.getSpecies().getName());

        response.setBreedId(pet.getBreed().getId());
        response.setBreedName(pet.getBreed().getName());

        response.setGender(pet.getGender().name());

        response.setColorId(pet.getColor().getId());
        response.setColorName(pet.getColor().getName());

        response.setBirthDate(pet.getBirthDate());
        response.setPassportId(pet.getPassportId());
        response.setWeightKg(record.getWeightKg());
        response.setPhotoObjectKey(pet.getPhotoObjectKey());
        response.setComments(record.getNotes());
        response.setOwnerName(ownerName);

        return response;
    }

    private String resolveOwnerName(UUID ownerId, Jwt jwt) {
        if (jwt == null || ownerId == null) {
            return null;
        }
        try {
            AccountClient.InternalUserEmailResponse owner =
                accountClient.getOwnerEmail(ownerId, jwt.getTokenValue());
            if (owner != null && owner.fullName() != null && !owner.fullName().isBlank()) {
                return owner.fullName().trim();
            }
        } catch (Exception e) {
            logger.warn("Failed to resolve owner name for ownerId={}", ownerId, e);
        }
        return null;
    }

    @Transactional(readOnly = true)
    public List<HealthRecordResponse> listHealthRecords(UUID petId, UUID ownerId, Jwt jwt) {
        Pet pet = pets.findById(petId)
            .orElseThrow(() -> new NotFoundException("Pet not found"));

        if (!pet.getOwnerId().equals(ownerId)) {
            throw new ForbiddenOperationException("you can only view health records of your own pets");
        }

        List<PetHealthRecord> records =
            healthRepo.findByPetIdAndOwnerIdWithSymptoms(petId, ownerId);

        String ownerName = resolveOwnerName(ownerId, jwt);
        return records.stream()
            .map(r -> toHealthDto(r, ownerName))
            .toList();
    }



    @Transactional(readOnly = true)
    public java.util.List<PetResponse> listOwnerPetsForVet(UUID ownerId) {
        return pets.findByOwnerId(ownerId)
            .stream()
            .map(PetMapper::toDto)
            .collect(Collectors.toList());
    }

    public PresignedUrlResponse createPhotoUploadUrl(
        Jwt jwt,
        CreatePetPhotoUploadUrlRequest req
    ) {
        ensureRoleIsOwner(jwt);

        UUID ownerId = getSubject(jwt);
        String objectKey = photoStorage.buildObjectKey(ownerId, req.getFileName());
        String url = photoStorage.generateUploadUrl(objectKey, req.getContentType());

        return new PresignedUrlResponse(url, objectKey);
    }

    public PresignedUrlResponse createPhotoDownloadUrl(
        Jwt jwt,
        String objectKey
    ) {
        //        ensureRoleIsOwner(jwt);

        String url = photoStorage.generateDownloadUrl(objectKey);
        return new PresignedUrlResponse(url, objectKey);
    }


    @Transactional(readOnly = true)
    public List<HealthRecordResponse> listAllHealthRecordsForVet(Jwt jwt) {
        requireVet(jwt);

        List<PetHealthRecord> records = healthRepo.findAllWithSymptoms();
        Map<UUID, String> ownerNames = new HashMap<>();

        return records.stream()
            .map(r -> toHealthDto(
                r,
                ownerNames.computeIfAbsent(r.getOwnerId(), id -> resolveOwnerName(id, jwt))
            ))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<HealthRecordResponse> listHealthRecordsByOwner(UUID ownerId, Jwt jwt) {
        List<PetHealthRecord> records = healthRepo.findByOwnerId(ownerId);
        String ownerName = resolveOwnerName(ownerId, jwt);

        return records.stream()
            .map(r -> toHealthDto(r, ownerName))
            .toList();
    }


    private void requireVet(Jwt jwt) {
        Object roleClaim = jwt.getClaims().get("role");
        if (roleClaim == null) {
            throw new ForbiddenOperationException("veterinarian role required");
        }

        if (roleClaim instanceof String s) {
            String v = s.toLowerCase(Locale.ROOT);
            if (v.contains("vet") || v.contains("veterinarian")) {
                return;
            }
        }

        if (roleClaim instanceof java.util.Collection<?> c) {
            for (Object o : c) {
                if (o instanceof String s) {
                    String v = s.toLowerCase(Locale.ROOT);
                    if (v.contains("vet") || v.contains("veterinarian")) {
                        return;
                    }
                }
            }
        }

        throw new ForbiddenOperationException("veterinarian role required");
    }

    @Transactional
    public RecommendationResponse createRecommendation(
        Jwt jwt,
        UUID healthRecordId,
        RecommendationRequest req
    ) {
        //requireVet(jwt);

        PetHealthRecord record = healthRepo.findById(healthRecordId)
            .orElseThrow(() -> new NotFoundException("health record not found"));

        PetHealthRecommendation rec = recommendationRepo
            .findByHealthRecordId(healthRecordId)
            .orElseGet(PetHealthRecommendation::new);

        rec.setHealthRecord(record);
        rec.setVetId(getSubject(jwt));
        rec.setPayload(writePayload(req.getPayload()));
        rec.assignNewId();

        PetHealthRecommendation saved = recommendationRepo.save(rec);

        UUID vetId = UUID.fromString(jwt.getSubject());

        auditClient.writeLog(jwt.getTokenValue(), new dev.pet.pets.dto.CreateAuditLogRequest(
            vetId,
            "RECOMMENDATION_CREATED",
            "{\"ownerId\":\"" + record.getOwnerId() + "\",\"petId\":\"" + record.getPet().getId() +
                "\",\"healthRecordId\":\"" + record.getId() + "\",\"recommendationId\":\"" + saved.getId() + "\"}"
        ));
        createAndSendRecommendationNotification(jwt, record, saved.getId(), false);
        return toRecommendationResponse(saved);
    }

    @Transactional(readOnly = true)
    public RecommendationResponse getRecommendation(Jwt jwt, UUID healthRecordId) {
        PetHealthRecord record = healthRepo.findById(healthRecordId)
            .orElseThrow(() -> new NotFoundException("health record not found"));

        if (!isAdminOrVet(jwt)) {
            ensureOwner(jwt, record.getOwnerId());
        }

        PetHealthRecommendation rec = recommendationRepo
            .findByHealthRecordId(healthRecordId)
            .orElseThrow(() -> new NotFoundException("recommendation not found"));

        return toRecommendationResponse(rec);
    }

    @Transactional
    public RecommendationResponse updateRecommendation(
        Jwt jwt,
        UUID healthRecordId,
        RecommendationRequest req
    ) {
        //requireVet(jwt);

        PetHealthRecord record = healthRepo.findById(healthRecordId)
            .orElseThrow(() -> new NotFoundException("health record not found"));

        PetHealthRecommendation rec = recommendationRepo
            .findByHealthRecordId(healthRecordId)
            .orElseThrow(() -> new NotFoundException("recommendation not found"));


        rec.setHealthRecord(record);
        rec.setVetId(getSubject(jwt));
        rec.setPayload(writePayload(req.getPayload()));

        PetHealthRecommendation saved = recommendationRepo.save(rec);
        UUID vetId = UUID.fromString(jwt.getSubject());

        auditClient.writeLog(jwt.getTokenValue(), new dev.pet.pets.dto.CreateAuditLogRequest(
            vetId,
            "RECOMMENDATION_UPDATED",
            "{\"ownerId\":\"" + record.getOwnerId() + "\",\"petId\":\"" + record.getPet().getId() +
                "\",\"healthRecordId\":\"" + record.getId() + "\",\"recommendationId\":\"" + saved.getId() + "\"}"
        ));
        createAndSendRecommendationNotification(jwt, record, saved.getId(), true);
        return toRecommendationResponse(saved);
    }

    private RecommendationResponse toRecommendationResponse(PetHealthRecommendation rec) {
        RecommendationResponse dto = new RecommendationResponse();
        dto.setId(rec.getId());
        dto.setHealthRecordId(rec.getHealthRecord().getId());
        dto.setVetId(rec.getVetId());
        dto.setCreatedAt(rec.getCreatedAt());
        dto.setPayload(readPayload(rec.getPayload()));
        return dto;
    }


    private String writePayload(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize recommendation payload", e);
        }
    }

    private Object readPayload(String payload) {
        try {
            return objectMapper.readValue(payload, Object.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to deserialize recommendation payload", e);
        }
    }


    private void createAndSendRecommendationNotification(
        Jwt jwt,
        PetHealthRecord record,
        UUID recommendationId,
        boolean updated
    ) {
        UUID ownerId = record.getOwnerId();
        UUID petId = record.getPet().getId();
        String petName = record.getPet().getName();

        String url = frontendBaseUrl + "/recommendation/" + recommendationId;

        String title = updated ? "Рекомендация обновлена" : "Рекомендация готова";
        String subject = updated
            ? "Рекомендация обновлена для питомца «%s»".formatted(petName)
            : "Рекомендация готова для питомца «%s»".formatted(petName);

        String plainMessage = updated
            ? "Рекомендация для вашего питомца «%s» была обновлена.".formatted(petName)
            : "Для вашего питомца «%s» была создана рекомендация.".formatted(petName);

        String html = """
<!doctype html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>%s</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#111111;">
  <div style="max-width:640px;margin:0 auto;padding:28px 20px;">
    <h1 style="margin:0 0 14px 0;font-size:22px;line-height:1.25;font-weight:700;">
      %s
    </h1>

    <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#111111;">
      %s
    </p>

    <div style="margin:18px 0 22px 0;">
      <a href="%s"
         style="display:inline-block;background:#111111;color:#ffffff;text-decoration:none;
                padding:12px 18px;border-radius:6px;font-size:14px;font-weight:700;">
        Посмотреть
      </a>
    </div>

    <p style="margin:0 0 10px 0;font-size:12px;line-height:1.6;color:#6b7280;">
      Если вы не ожидали это письмо, просто проигнорируйте его.
    </p>

    <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
    </p>
  </div>
</body>
</html>
""".formatted(
            subject,
            updated ? "Рекомендация обновлена" : "Рекомендация готова",
            updated
                ? "Рекомендация для вашего питомца «%s» была обновлена.".formatted(petName)
                : "Для вашего питомца «%s» была создана рекомендация.".formatted(petName),
            url
        );


        dev.pet.pets.domain.Notification n = new dev.pet.pets.domain.Notification();
        n.assignNewId();
        n.setOwnerId(ownerId);
        n.setPetId(petId);
        n.setMessage(plainMessage);
        notificationRepo.save(n);

        var owner = accountClient.getOwnerEmail(ownerId, jwt.getTokenValue());
        if (owner == null || owner.email() == null || owner.email().isBlank()) {
            logger.warn("Owner email not found for ownerId={}", ownerId);
            return;
        }

        emailProducer.sendRecommendationEmail(
            owner.email(),
            subject,
            html,
            java.util.Map.of()
        );
    }
}