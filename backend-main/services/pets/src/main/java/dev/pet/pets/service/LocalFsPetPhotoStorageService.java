package dev.pet.pets.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.UUID;

@Service
@ConditionalOnProperty(name = "app.photo-storage.type", havingValue = "fs")
public class LocalFsPetPhotoStorageService implements PetPhotoStorage {

    private final String baseUrl;

    public LocalFsPetPhotoStorageService(@Value("${app.photo-storage.base-url:}") String baseUrl) {
        this.baseUrl = baseUrl == null ? "" : baseUrl.trim();
    }

    @Override
    public String buildObjectKey(UUID ownerId, String originalFilename) {
        String filename = originalFilename == null ? "" : originalFilename.trim();
        String extension = "";
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex >= 0 && dotIndex < filename.length() - 1) {
            extension = filename.substring(dotIndex);
        }
        return "pets/" + ownerId + "/" + UUID.randomUUID() + extension;
    }

    @Override
    public String generateUploadUrl(String objectKey, String contentType) {
        UriComponentsBuilder b = baseUrl.isBlank()
            ? UriComponentsBuilder.newInstance()
            : UriComponentsBuilder.fromUriString(baseUrl);

        return b
            .path("/api/v1/pets/photos/upload")
            .queryParam("objectKey", objectKey)
            .build()
            .toUriString();
    }

    @Override
    public String generateDownloadUrl(String objectKey) {
        UriComponentsBuilder b = baseUrl.isBlank()
            ? UriComponentsBuilder.newInstance()
            : UriComponentsBuilder.fromUriString(baseUrl);

        return b
            .path("/api/v1/pets/photos/download")
            .queryParam("objectKey", objectKey)
            .build()
            .toUriString();
    }
}
