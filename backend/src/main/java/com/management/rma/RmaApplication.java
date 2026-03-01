package com.management.rma;

import com.management.rma.model.User;
import com.management.rma.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class RmaApplication {
    static void main(String[] args) {
        SpringApplication.run(RmaApplication.class, args);
    }
    @Bean
    CommandLineRunner initDatabase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Check for 'admin'
            if (userRepository.findByUsername("admin") == null) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole("ADMIN");
                userRepository.save(admin);
                System.out.println("✅ Admin account created: admin / admin123");
            }

            // Check for 'hello'
            if (userRepository.findByUsername("hello") == null) {
                User testUser = new User();
                testUser.setUsername("hello");
                testUser.setPassword(passwordEncoder.encode("hello"));
                testUser.setRole("STAFF");
                userRepository.save(testUser);
                System.out.println("✅ Test account created: hello / hello");
            } else {
                System.out.println("ℹ️ User 'hello' already exists, skipping creation.");
            }
        };
    }
}