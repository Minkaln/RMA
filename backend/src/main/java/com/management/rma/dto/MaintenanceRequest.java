package com.management.rma.dto;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.management.rma.model.Room;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name="maintenance_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String message;
    private LocalDateTime createdAt = LocalDateTime.now();
    private boolean completed = false;

    @ManyToOne
    @JoinColumn(name="room_id")
    @JsonBackReference
    private Room room;

    public MaintenanceRequest(String message, Room room) {
        this.message = message;
        this.room = room;
    }

}
