package com.management.rma.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String roomNumber;
    private String type;
    private String status;
    private String guestName;
    private LocalDateTime currentCheckInTime;
    private LocalDateTime lastCheckOutTime;

    // Fix: Remove 'Double price' because it doesn't exist in your fields
    public Room(String roomNumber, String type, String status) {
        this.roomNumber = roomNumber;
        this.type = type;
        this.status = status;
    }

    // Change this line in your Room.java
    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true) // 👈 Add orphanRemoval = true
    @JsonIgnore
    private List<Reservation> reservations;
}