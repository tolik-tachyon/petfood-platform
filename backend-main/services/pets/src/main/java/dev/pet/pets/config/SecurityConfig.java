package dev.pet.pets.config;

import java.util.*;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.core.convert.converter.Converter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private static final String[] SWAGGER_WHITELIST = {
        "/v3/api-docs/**",
        "/swagger-ui/**",
        "/swagger-ui.html"
    };

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(SWAGGER_WHITELIST).permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/api/v1/pets/bio").hasRole("VET")
                .requestMatchers("/api/v1/pets").permitAll()
                .requestMatchers("/api/v1/pets/me").hasRole("USER")
                .requestMatchers("/api/v1/pets/{id}").authenticated()
                .requestMatchers("/api/v1/pets/digestion/**").permitAll()
                .requestMatchers("/api/v1/pets/photos/upload").permitAll()
                .requestMatchers("/api/v1/pets/photos/download").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth ->
                oauth.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
            );

        return http.build();
    }


    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();

        Converter<Jwt, Collection<GrantedAuthority>> jwtAuthoritiesConverter = jwt -> {
            Object roleClaim = jwt.getClaims().get("role");
            if (roleClaim instanceof String s) {
                return List.of(new SimpleGrantedAuthority("ROLE_" + s.toUpperCase()));
            }
            return List.of();
        };

        converter.setJwtGrantedAuthoritiesConverter(jwtAuthoritiesConverter);
        return converter;
    }

}
