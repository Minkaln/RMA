package com.management.rma.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "rooms")
@Data
@NoArgsConstructor // Creates the empty constructor for JPA
public class Room {
    private String guestName;
    private LocalDateTime currentCheckInTime; // Set when guest checks in
    private LocalDateTime lastCheckOutTime;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String roomNumber;

    private String phoneNumber;
    private String type;
    private String status; // Keep this (e.g., "Available", "Occupied")

    public Room(String roomNumber, String type, Double price, String status) {
        this.roomNumber = roomNumber;
        this.type = type;
        this.status = status;
    }

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL)
    @JsonManagedReference // This is the "Forward" part
    private List<Reservation> reservations;

}