package dev.pet.pets.service;

import dev.pet.pets.config.MinioProperties;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.http.Method;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@ConditionalOnProperty(name="app.photo-storage.type", havingValue="minio", matchIfMissing=true)
public class MinioPetPhotoStorageService implements PetPhotoStorage {

    private final MinioClient minioClient;
    private final MinioProperties props;

    public MinioPetPhotoStorageService(
        MinioClient minioClient,
        MinioProperties props
    ) {
        this.minioClient = minioClient;
        this.props = props;
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
        try {
            GetPresignedObjectUrlArgs.Builder builder = GetPresignedObjectUrlArgs.builder()
                .bucket(props.getBucket())
                .object(objectKey)
                .expiry(props.getUploadTtlSeconds())
                .method(Method.PUT);

            if (contentType != null && !contentType.isBlank()) {
                Map<String, String> headers = new HashMap<>();
                headers.put("Content-Type", contentType);
                builder.extraHeaders(headers);
            }

            return minioClient.getPresignedObjectUrl(builder.build());
        } catch (Exception e) {
            System.out.println(e.toString());
            throw new IllegalStateException("Failed to generate upload URL for pet photo", e);
        }
    }

    @Override
    public String generateDownloadUrl(String objectKey) {
        try {
            return minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                    .bucket(props.getBucket())
                    .object(objectKey)
                    .expiry(props.getDownloadTtlSeconds())
                    .method(Method.GET)
                    .build()
            );
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate download URL for pet photo", e);
        }
    }
}
