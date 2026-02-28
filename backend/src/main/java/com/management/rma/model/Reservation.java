package com.management.rma.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "reservations")
@Data
public class Reservation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String guestName;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;

    // Inside Reservation.java
    @ManyToOne
    @JoinColumn(name = "room_id")
    @JsonBackReference // This tells Jackson: "Stop here, don't go back into Room"
    private Room room;
}