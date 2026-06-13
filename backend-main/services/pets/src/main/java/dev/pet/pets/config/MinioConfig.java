package dev.pet.pets.config;

import io.minio.MinioClient;
import okhttp3.OkHttpClient;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.net.ssl.*;
import java.security.cert.X509Certificate;

@Configuration
@EnableConfigurationProperties(MinioProperties.class)
@ConditionalOnProperty(name="app.photo-storage.type", havingValue="minio", matchIfMissing=true)
public class MinioConfig {

    @Bean
    public MinioClient minioClient(MinioProperties props) throws Exception {

        TrustManager[] trustAllCerts = new TrustManager[]{
            new X509TrustManager() {
                public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
                public void checkClientTrusted(X509Certificate[] certs, String authType) {}
                public void checkServerTrusted(X509Certificate[] certs, String authType) {}
            }
        };

        SSLContext sslContext = SSLContext.getInstance("TLS");
        sslContext.init(null, trustAllCerts, new java.security.SecureRandom());

        OkHttpClient httpClient = new OkHttpClient.Builder()
            .sslSocketFactory(sslContext.getSocketFactory(), (X509TrustManager) trustAllCerts[0])
            .hostnameVerifier((hostname, session) -> true)
            .build();

        return MinioClient.builder()
            .endpoint(props.getEndpoint())
            .credentials(props.getAccessKey(), props.getSecretKey())
            .httpClient(httpClient)
            .build();
    }
}
