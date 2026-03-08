package com.management.rma.controller;

import com.management.rma.dto.RoomRequest;
import com.management.rma.model.Room;
import com.management.rma.repository.RoomRepository;
import jakarta.transaction.Transactional;
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
        List<Room> rooms = roomRepository.findAll();
        System.out.println("DEBUG: Number of rooms found in database: " + rooms.size());
        return rooms;
    }

    // This handles the 📦 Request button from React
    @PostMapping("/request")
    @Transactional
    public ResponseEntity<Room> handleRoomRequest(@RequestBody RoomRequest dto) {
        System.out.println("Recieved Room ID: "+dto.getRoomId());
        System.out.println(("Recieved Room Request: "+dto.getRequestMessage()));
        return roomRepository.findById(dto.getRoomId())
                .map(room -> {
                    room.addMaintenanceRequest(dto.getRequestMessage());
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

    @DeleteMapping("/{roomId}/requests/{requestId}")
    @Transactional
    public ResponseEntity<Room> deleteSpecificRequest(@PathVariable Long roomId, @PathVariable Long requestId) {
        return roomRepository.findById(roomId).map(room -> {
            // Now 'req' is an object, so .getId() works!
            room.getMaintenanceRequests().removeIf(req -> req.getId().equals(requestId));
            return ResponseEntity.ok(roomRepository.save(room));
        }).orElse(ResponseEntity.notFound().build());
    }
    @DeleteMapping("/{roomId}/requests/clear-all")
    @Transactional
    public ResponseEntity<Room> clearAllRoomRequests(@PathVariable Long roomId) {
        return roomRepository.findById(roomId).map(room -> {
            room.getMaintenanceRequests().clear();
            return ResponseEntity.ok(roomRepository.save(room));
        }).orElse(ResponseEntity.notFound().build());
    }
}