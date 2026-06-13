package dev.pet.pets.service;

import java.util.UUID;

public interface PetPhotoStorage {
    String buildObjectKey(UUID ownerId, String originalFilename);
    String generateUploadUrl(String objectKey, String contentType);
    String generateDownloadUrl(String objectKey);
}
