package com.management.rma.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String password;
    private String role;

    @Column(name = "failed_attempts")
    private int failedAttempts = 0;

    @Column(name = "is_locked")
    private boolean locked = false;
}