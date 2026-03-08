package com.management.rma;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class RmaApplication {
    static void main(String[] args) {
        SpringApplication.run(RmaApplication.class, args);
    }
    // Defining this here ensures DataInitializer can @Autwire/Inject it
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}