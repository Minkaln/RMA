package com.management.rma.config;

import com.management.rma.model.User;
import com.management.rma.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Check if any user exists
        if (userRepository.findByUsername("admin") == null) {
            User admin = new User();
            admin.setUsername("admin");
            // Hash the password "admin123"
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");
            admin.setLocked(false);
            admin.setFailedAttempts(0);

            userRepository.save(admin);
        }

        if (userRepository.findByUsername("user") == null) {
            User normalUser = new User();
            normalUser.setUsername("user");
            normalUser.setPassword(passwordEncoder.encode("user123"));
            normalUser.setRole("USER");
            normalUser.setLocked(false);
            normalUser.setFailedAttempts(0);

            userRepository.save(normalUser);
        }
    }
}