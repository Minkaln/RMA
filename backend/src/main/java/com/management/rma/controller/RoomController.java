package com.management.rma.controller;

import com.management.rma.dto.RoomRequest;
import com.management.rma.model.Room;
import com.management.rma.repository.RoomRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "http://localhost:3000")
public class RoomController {

    private final RoomRepository roomRepository;

    // Constructor injection for the Repository
    public RoomController(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @GetMapping
    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    // This handles the 📦 Request button from React
    @PostMapping("/request")
    public ResponseEntity<Room> handleRoomRequest(@RequestBody RoomRequest dto) {
        return roomRepository.findById(dto.getRoomId())
                .map(room -> {
                    room.setCurrentRequest(dto.getRequestMessage());
                    return ResponseEntity.ok(roomRepository.save(room));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    @PutMapping("/{id}/clear-request")
    public ResponseEntity<Room> clearRoomRequest(@PathVariable Long id) {
        return roomRepository.findById(id)
                .map(room -> {
                    room.setCurrentRequest(null);
                    return ResponseEntity.ok(roomRepository.save(room));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Room addRoom(@RequestBody Room room) {
        if (room.getStatus() == null) room.setStatus("Available");
        return roomRepository.save(room);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoom(@PathVariable Long id) {
        roomRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/clean")
    public ResponseEntity<Room> markCleaned(@PathVariable Long id) {
        return roomRepository.findById(id)
                .map(room -> {
                    room.setStatus("Available");
                    return ResponseEntity.ok(roomRepository.save(room));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}