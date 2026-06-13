package dev.pet.pets.api;

import dev.pet.pets.domain.*;
import dev.pet.pets.repo.*;
import org.springframework.web.bind.annotation.*;
import dev.pet.pets.dto.ReproductiveStatusItem;
import dev.pet.pets.dto.ReproductiveSubStatusItem;

import java.util.List;

@RestController
@RequestMapping("/api/v1/pets/ref")
public class ReferenceController {

    private final SpeciesRepository speciesRepo;
    private final BreedRepository breedRepo;
    private final ColorRepository colorRepo;
    private final ActivityTypeRepository activityTypeRepo;
    private final SymptomRepository symptomRepo;
    private final ReproductiveStatusRepository reproductiveStatusRepo;
    private final ReproductiveSubStatusRepository reproductiveSubStatusRepo;

    public ReferenceController(
        SpeciesRepository speciesRepo,
        BreedRepository breedRepo,
        ColorRepository colorRepo,
        ActivityTypeRepository activityTypeRepo,
        SymptomRepository symptomRepo,
        ReproductiveStatusRepository reproductiveStatusRepo,
        ReproductiveSubStatusRepository reproductiveSubStatusRepo
    ) {
        this.speciesRepo = speciesRepo;
        this.breedRepo = breedRepo;
        this.colorRepo = colorRepo;
        this.activityTypeRepo = activityTypeRepo;
        this.symptomRepo = symptomRepo;
        this.reproductiveStatusRepo = reproductiveStatusRepo;
        this.reproductiveSubStatusRepo = reproductiveSubStatusRepo;
    }
    @GetMapping("/species")
    public List<Species> species() {
        return speciesRepo.findAll();
    }

    @GetMapping("/breeds")
    public List<dev.pet.pets.dto.BreedItem> breeds(@RequestParam Long speciesId) {
        var s = speciesRepo.findById(speciesId)
            .orElseThrow(() -> new dev.pet.pets.error.NotFoundException("species not found"));
        return breedRepo.findItemsBySpecies(s);
    }

    @GetMapping("/colors")
    public List<Color> colors() {
        return colorRepo.findAll();
    }
    @GetMapping("/activity-types")
    public List<ActivityType> activityTypes() {
        return activityTypeRepo.findAll();
    }

    @GetMapping("/symptoms")
    public List<Symptom> symptoms() {
        return symptomRepo.findAll();
    }

    @GetMapping("/reproductive-statuses")
    public List<ReproductiveStatusItem> reproductiveStatuses(
        @RequestParam String gender
    ) {
        Gender g = Gender.valueOf(gender.toLowerCase());
        return reproductiveStatusRepo.findByGender(g)
            .stream()
            .map(s -> new ReproductiveStatusItem(
                s.getId(),
                s.getCode(),
                s.getName(),
                s.getGender().name(),
                s.isRequiresSubstatus()
            ))
            .toList();
    }

    @GetMapping("/reproductive-sub-statuses")
    public List<ReproductiveSubStatusItem> reproductiveSubStatuses(
        @RequestParam Long statusId
    ) {
        ReproductiveStatus status = reproductiveStatusRepo
            .findById(statusId)
            .orElseThrow(() -> new dev.pet.pets.error.NotFoundException("reproductive status not found"));

        return reproductiveSubStatusRepo.findByStatus(status)
            .stream()
            .map(ss -> new ReproductiveSubStatusItem(
                ss.getId(),
                status.getId(),
                null,
                ss.getName()
            ))
            .toList();
    }
}
