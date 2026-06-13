package dev.pet.auth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

@Configuration
public class RedisConfig {

    // Spring Boot сам создаёт StringRedisTemplate на основании spring.data.redis.*
    @Bean
    public ValueOperations<String, String> valueOps(StringRedisTemplate stringRedisTemplate) {
        return stringRedisTemplate.opsForValue();
    }
}
