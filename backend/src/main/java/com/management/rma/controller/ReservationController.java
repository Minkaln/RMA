package com.management.rma.controller;

import com.management.rma.model.Reservation;
import com.management.rma.dto.ReservationRequest;
import com.management.rma.model.Room;
import com.management.rma.repository.ReservationRepository;
import com.management.rma.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/reservations")
@CrossOrigin(origins = "http://localhost:3000")
public class ReservationController {

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private RoomRepository roomRepository;

    @PostMapping("/book")
    public Reservation bookRoom(@RequestBody ReservationRequest request) {
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new RuntimeException("Room not found"));

        room.setStatus("Reserved");
        roomRepository.save(room);

        Reservation res = new Reservation();
        res.setGuestName(request.getGuestName());
        res.setPhoneNumber(request.getPhoneNumber());     // Error should disappear now
        res.setNumberOfPeople(request.getNumberOfPeople()); // Error should disappear now
        res.setRoom(room);

        return reservationRepository.save(res);
    }

    @PutMapping("/{roomId}/cancel")
    public void cancelReservation(@PathVariable Long roomId) {
        // Find the room
        Room room = roomRepository.findById(roomId).orElseThrow();

        // Find the latest reservation for this room that isn't checked out/cancelled
        Reservation res = reservationRepository.findAll().stream()
                .filter(r -> r.getRoom().getId().equals(roomId) && !"Cancelled".equals(r.getReservationStatus()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No active reservation found for this room"));

        res.setReservationStatus("Cancelled");
        room.setStatus("Available");

        reservationRepository.save(res);
        roomRepository.save(room);
    }

    @PutMapping("/{roomId}/check-in")
    public Room checkIn(@PathVariable Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        room.setStatus("Occupied");
        room.setCurrentCheckInTime(LocalDateTime.now());
        return roomRepository.save(room);
    }

    @PutMapping("/{id}/check-out")
    public Room checkOut(@PathVariable Long id) {
        Room room = roomRepository.findById(id).orElseThrow();
        room.setStatus("Available");
        room.setLastCheckOutTime(LocalDateTime.now()); // Record the end
        room.setCurrentCheckInTime(null); // Clear the current check-in
        return roomRepository.save(room);
    }
}