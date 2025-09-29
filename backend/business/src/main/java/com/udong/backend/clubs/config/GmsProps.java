package com.udong.backend.clubs.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.gms")
public record GmsProps(
        boolean enabled,
        String baseUrl,
        String apiKey,
        String model,
        String size
) {}

