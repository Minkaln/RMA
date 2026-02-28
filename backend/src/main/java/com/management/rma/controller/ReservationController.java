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
        Room room = roomRepository.findById(request.getRoomId()).orElseThrow();

        // When someone books, it becomes 'Reserved'
        room.setStatus("Reserved");
        roomRepository.save(room);

        Reservation res = new Reservation();
        res.setGuestName(request.getGuestName());
        res.setCheckInTime(LocalDateTime.now());
        res.setRoom(room);
        return reservationRepository.save(res);
    }

    @PutMapping("/{id}/check-in")
    public Room checkIn(@PathVariable Long id) {
        Room room = roomRepository.findById(id).orElseThrow();
        room.setStatus("Occupied");
        room.setCurrentCheckInTime(LocalDateTime.now()); // Record the start
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