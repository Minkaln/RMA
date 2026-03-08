package com.management.rma.service;

import com.management.rma.model.User;
import com.management.rma.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired private UserRepository userRepository;
    @Autowired private BCryptPasswordEncoder passwordEncoder;

    public String authenticate(String username, String password, HttpServletRequest request) {
        User user = userRepository.findByUsername(username);

        // 1. Check if user exists
        if (user == null) {
            return "User not found";
        }

        // 2. Check if account is locked (Stage 3 restriction)
        if (user.isLocked()) {
            return "Account locked. Please contact your administrator.";
        }

        // 3. Verify Password
        if (passwordEncoder.matches(password, user.getPassword())) {
            // SUCCESS: Reset failed attempts
            user.setFailedAttempts(0);
            userRepository.save(user);

            // Access Management: Set Session
            HttpSession session = request.getSession(true);
            session.setAttribute("userId", user.getId());
            session.setAttribute("role", user.getRole());

            return "SUCCESS";
        } else {
            // FAILURE: Increment attempts
            int currentAttempts = user.getFailedAttempts() + 1;
            user.setFailedAttempts(currentAttempts);

            // Restrict if wrong more than 3 times
            if (currentAttempts >= 3) {
                user.setLocked(true);
                userRepository.save(user);
                return "Too many failed attempts. Account is now locked.";
            }

            userRepository.save(user);
            return "Invalid password. Attempt " + currentAttempts + " of 3.";
        }
    }
}