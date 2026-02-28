package com.management.rma.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "staff_accounts")
@Data
public class Staff {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    private String password;
    private String role; // e.g., "FRONT_DESK", "HOUSEKEEPING"
}