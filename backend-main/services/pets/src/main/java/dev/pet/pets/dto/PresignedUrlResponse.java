package dev.pet.pets.dto;

public class PresignedUrlResponse {

    private String url;
    private String objectKey;

    public PresignedUrlResponse() {
    }

    public PresignedUrlResponse(String url, String objectKey) {
        this.url = url;
        this.objectKey = objectKey;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getObjectKey() {
        return objectKey;
    }

    public void setObjectKey(String objectKey) {
        this.objectKey = objectKey;
    }
}
