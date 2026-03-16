package com.management.rma.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.management.rma.dto.MaintenanceRequest;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
    @Column(name = "current_request")
    private String request;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<Reservation> reservations;

    public Room(String roomNumber, String type, Double price, String status) {
        this.roomNumber = roomNumber;
        this.type = type;
        this.status = status;
    }

    @Transient
    public String getGuestName() {
        return null;
    }

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

    public void setCurrentRequest(String request) {
        this.request = request;
    }


    // Update the bridge method
    @CollectionTable(name = "room_requests", joinColumns = @JoinColumn(name = "room_id"))
    @Column(name = "request_message")
    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<MaintenanceRequest> maintenanceRequests = new ArrayList<>();
    public void addMaintenanceRequest(String message) {
        if (this.maintenanceRequests == null) {
            this.maintenanceRequests = new ArrayList<>();
        }
        // Bridge: Create the object and link it to this room
        this.maintenanceRequests.add(new MaintenanceRequest(message, this));
    }

    public void clearAllRequests() {
        this.maintenanceRequests.clear();
    }
}