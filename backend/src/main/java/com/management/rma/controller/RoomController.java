package com.management.rma.controller;

import com.management.rma.model.Room;
import com.management.rma.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public Room addRoom(@RequestBody Room room) {
        // Check if the room number already exists in the database
        if (roomRepository.existsByRoomNumber(room.getRoomNumber())) {
            throw new RuntimeException("Room number " + room.getRoomNumber() + " already exists!");
        }
        return roomRepository.save(room);
    }

    @DeleteMapping("/{id}") // Handles "Deleting" a room by its ID
    public void deleteRoom(@PathVariable Long id) {
        roomRepository.deleteById(id);
    }
}