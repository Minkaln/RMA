package com.management.rma.controller;

import com.management.rma.dto.RoomRequest;
import com.management.rma.model.Room;
import com.management.rma.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "http://localhost:3000") // Allows React to talk to Java
public class RoomController {
    @Autowired
    private RoomRepository roomRepository;

    @GetMapping
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }
    // Inside RoomController.java
    @PostMapping
    public ResponseEntity<?> addRoom(@RequestBody Room room) {
        // Check if room number already exists
        if (roomRepository.existsByRoomNumber(room.getRoomNumber())) {
            // This message is what React will receive
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Room " + room.getRoomNumber() + " already exists!");
        }
        return ResponseEntity.ok(roomRepository.save(room));
    }
    @DeleteMapping("/{id}") // Handles "Deleting" a room by its ID
    public void deleteRoom(@PathVariable Long id) {
        roomRepository.deleteById(id);
    }
    @PutMapping("/{id}/clean")
    public Room markCleaned(@PathVariable Long id) {
        Room room = roomRepository.findById(id).orElseThrow();
        room.setStatus("Available"); // 👈 This moves it from Cleaning to Available
        return roomRepository.save(room);
    }

}