package com.management.rma.controller;

import com.management.rma.model.Reservation;
import com.management.rma.dto.ReservationRequest;
import com.management.rma.model.Room;
import com.management.rma.repository.ReservationRepository;
import com.management.rma.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
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
        // JSON body handles spaces automatically
        res.setGuestName(request.getGuestName());
        res.setPhoneNumber(request.getPhoneNumber());
        res.setRoom(room);

        return reservationRepository.save(res);
    }

    @PutMapping("/room/{roomId}/cancel")
    public Room cancelByRoom(@PathVariable Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        Reservation res = reservationRepository.findAll().stream()
                .filter(r -> r.getRoom().getId().equals(roomId) && "Reserved".equals(room.getStatus()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No active reservation to cancel"));

        res.setReservationStatus("Cancelled");
        room.setStatus("Available");

        reservationRepository.save(res);
        return roomRepository.save(room);
    }

    @PutMapping("/{id}/check-in")
    public Room checkIn(@PathVariable Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        Reservation res = reservationRepository.findAll().stream()
                .filter(r -> r.getRoom().getId().equals(id) && !"Cancelled".equals(r.getReservationStatus()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No active reservation found for this room"));

        // If the name was somehow encoded with %20, this decodes it back to a space
        String name = res.getGuestName();
        if (name != null && name.contains("%20")) {
            name = URLDecoder.decode(name, StandardCharsets.UTF_8);
        }

        room.setGuestName(name);
        room.setPhoneNumber(res.getPhoneNumber());
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
        room.setPhoneNumber(null);

        return roomRepository.save(room);
    }

    @PostMapping("/{roomId}/check-in-direct")
    public Room checkInDirect(@PathVariable Long roomId, @RequestBody ReservationRequest request) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (!"Available".equals(room.getStatus())) {
            throw new RuntimeException("Room is not available for direct check-in");
        }

        Reservation res = new Reservation();
        res.setGuestName(request.getGuestName());
        res.setPhoneNumber(request.getPhoneNumber());
        res.setRoom(room);
        res.setReservationStatus("Direct-Check-In");
        reservationRepository.save(res);

        room.setStatus("Occupied");
        room.setGuestName(request.getGuestName());
        room.setPhoneNumber(request.getPhoneNumber());
        room.setCurrentCheckInTime(LocalDateTime.now());

        return roomRepository.save(room);
    }
}