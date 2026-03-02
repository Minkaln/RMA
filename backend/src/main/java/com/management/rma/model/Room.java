package com.management.rma.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "rooms")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Room {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String roomNumber;

    private String type;
    private String status;
    private LocalDateTime currentCheckInTime;
    private LocalDateTime lastCheckOutTime;
    private String currentRequest;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<Reservation> reservations;

    // OLD FIELDS REMOVED - NO guestName or phoneNumber in database

    public Room(String roomNumber, String type, Double price, String status) {
        this.roomNumber = roomNumber;
        this.type = type;
        this.status = status;
    }

    /**
     * Get guest name from CURRENT active reservation only
     * Returns null if room is Available or Cleaning
     */
    @Transient
    public String getGuestName() {
        if (reservations == null || reservations.isEmpty()) return null;
        return reservations.stream()
                .filter(res -> res.getReservationStatus() != null &&
                        (res.getReservationStatus().equals("Checked-In") ||
                                res.getReservationStatus().equals("Direct-Check-In")))
                .findFirst()
                .map(Reservation::getGuestName)
                .orElse(null);
    }

    /**
     * Get phone number from CURRENT active reservation only
     * Returns null if room is Available or Cleaning
     */
    @Transient
    public String getPhoneNumber() {
        if (reservations == null || reservations.isEmpty()) {
            return null;
        }

        return reservations.stream()
                .filter(res -> res.getReservationStatus() != null &&
                        (res.getReservationStatus().equals("Checked-In") ||
                                res.getReservationStatus().equals("Direct-Check-In")))
                .findFirst()
                .map(Reservation::getPhoneNumber)
                .orElse(null);
    }
}