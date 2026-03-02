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
        // Note: reservationStatus is null for "Reserved" bookings

        return reservationRepository.save(res);
    }

    @PutMapping("/room/{roomId}/cancel")
    public Room cancelByRoom(@PathVariable Long roomId) {
        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        // Find reservation with null status (Reserved) or Reserved status
        Reservation res = reservationRepository.findAll().stream()
                .filter(r -> r.getRoom().getId().equals(roomId) &&
                        (r.getReservationStatus() == null ||
                                r.getReservationStatus().equals("Reserved")))
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

        // Find reservation with null status (newly booked) OR Reserved status
        Reservation res = reservationRepository.findAll().stream()
                .filter(r -> r.getRoom().getId().equals(id) &&
                        (r.getReservationStatus() == null ||
                                r.getReservationStatus().equals("Reserved")) &&
                        !"Cancelled".equals(r.getReservationStatus()) &&
                        !"Checked-Out".equals(r.getReservationStatus()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("No active reservation found for this room"));

        room.setStatus("Occupied");
        room.setCurrentCheckInTime(LocalDateTime.now());

        res.setReservationStatus("Checked-In");
        reservationRepository.save(res);

        return roomRepository.save(room);
    }

    @PutMapping("/{id}/check-out")
    public Room checkOut(@PathVariable Long id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        // Mark the active reservation as Checked-Out
        Reservation activeRes = reservationRepository.findAll().stream()
                .filter(r -> r.getRoom().getId().equals(id) &&
                        (r.getReservationStatus().equals("Checked-In") ||
                                r.getReservationStatus().equals("Direct-Check-In")))
                .findFirst()
                .orElse(null);

        if (activeRes != null) {
            activeRes.setReservationStatus("Checked-Out");
            reservationRepository.save(activeRes);
        }

        room.setStatus("Cleaning");
        room.setLastCheckOutTime(LocalDateTime.now());
        room.setCurrentCheckInTime(null);

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
        room.setCurrentCheckInTime(LocalDateTime.now());

        return roomRepository.save(room);
    }
}