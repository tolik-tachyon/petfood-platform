package dev.pet.pets.api;

import dev.pet.pets.error.NotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StreamUtils;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.nio.file.*;

@RestController
@RequestMapping("/api/v1/pets/photos")
@ConditionalOnProperty(name = "app.photo-storage.type", havingValue = "fs")
public class PetPhotoController {

    private final Path rootDir;

    public PetPhotoController(
        @Value("${app.photo-storage.fs.root-dir:/data/pets-photos}") String rootDir
    ) {
        this.rootDir = Paths.get(rootDir).toAbsolutePath().normalize();
    }

    @PutMapping("/upload")
    public ResponseEntity<Void> upload(
        @RequestParam("objectKey") String objectKey,
        HttpServletRequest request
    ) {
        try {
            Path target = resolveSafe(objectKey);
            Files.createDirectories(target.getParent());

            try (InputStream in = request.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/download")
    public ResponseEntity<byte[]> download(@RequestParam("objectKey") String objectKey) {
        try {
            Path target = resolveSafe(objectKey);
            if (!Files.exists(target) || !Files.isRegularFile(target)) {
                throw new NotFoundException("photo not found");
            }

            byte[] bytes = Files.readAllBytes(target);
            String ct = Files.probeContentType(target);
            if (ct == null || ct.isBlank()) ct = MediaType.APPLICATION_OCTET_STREAM_VALUE;

            return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, ct)
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000")
                .body(bytes);
        } catch (NotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private Path resolveSafe(String objectKey) {
        if (objectKey == null) throw new IllegalArgumentException("objectKey is required");
        String cleaned = objectKey.trim();
        if (cleaned.isEmpty()) throw new IllegalArgumentException("objectKey is empty");

        Path resolved = rootDir.resolve(cleaned).normalize();
        if (!resolved.startsWith(rootDir)) {
            throw new IllegalArgumentException("invalid objectKey");
        }
        return resolved;
    }
}
