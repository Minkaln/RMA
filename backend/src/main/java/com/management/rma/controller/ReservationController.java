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
        res.setPhoneNumber(request.getPhoneNumber());
        res.setRoom(room);

        return reservationRepository.save(res);
    }

    @PutMapping("/{resId}/cancel")
    public void cancelReservation(@PathVariable Long resId) {
        Reservation res = reservationRepository.findById(resId).orElseThrow();
        res.setReservationStatus("Cancelled");

        Room room = res.getRoom();
        room.setStatus("Available"); // Free the room

        reservationRepository.save(res);
        roomRepository.save(room);
    }

    @PutMapping("/{id}/check-in")
    public Room checkIn(@PathVariable Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        Reservation res = reservationRepository.findAll().stream()
                .filter(r -> r.getRoom().getId().equals(id) && !"Cancelled".equals(r.getReservationStatus()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No active reservation found for this room"));

        room.setGuestName(res.getGuestName());
        room.setStatus("Occupied");
        room.setCurrentCheckInTime(LocalDateTime.now());

        res.setReservationStatus("Checked-In");
        reservationRepository.save(res);

        return roomRepository.save(room);
    }

    @PutMapping("/{id}/check-out")
    public Room checkOut(@PathVariable Long id) {
        Room room = roomRepository.findById(id).orElseThrow();

        room.setStatus("Cleaning");
        room.setLastCheckOutTime(LocalDateTime.now());
        room.setCurrentCheckInTime(null);
        room.setGuestName(null);

        return roomRepository.save(room);
    }
    @PostMapping("/{roomId}/check-in-direct")
    public Room checkInDirect(@PathVariable Long roomId, @RequestBody ReservationRequest request) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!"Available".equals(room.getStatus())) {
            throw new RuntimeException("Room is not available for direct check-in");
        }

        // 1. Create the Reservation record
        Reservation res = new Reservation();
        res.setGuestName(request.getGuestName());
        res.setPhoneNumber(request.getPhoneNumber()); // 👈 Add this line
        res.setRoom(room);
        res.setReservationStatus("Direct-Check-In");
        reservationRepository.save(res);

        // 2. Update Room status
        room.setStatus("Occupied");
        room.setGuestName(request.getGuestName());
        room.setCurrentCheckInTime(LocalDateTime.now());
        // If your Room model has a phoneNumber field, add: room.setPhoneNumber(request.getPhoneNumber());

        return roomRepository.save(room);
    }
}