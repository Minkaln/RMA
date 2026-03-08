package com.management.rma.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Apply to all endpoints
                .allowedOrigins("https://rma-frontend-production.up.railway.app/") // Your Railway Frontend URL
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowCredentials(true); // Required because you use withCredentials: true
    }
}