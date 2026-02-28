package com.management.rma;

import com.management.rma.model.Room;
import com.management.rma.repository.RoomRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataLoader implements CommandLineRunner {

    private final RoomRepository roomRepository;

    public DataLoader(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Inside DataLoader.java run() method:
        if (roomRepository.count() == 0) {
            roomRepository.save(new Room("101", "Deluxe", 150.0, "Available"));
            roomRepository.save(new Room("102", "Suite", 250.0, "Available"));
            roomRepository.save(new Room("103", "Single", 80.0, "Occupied"));
            System.out.println("Sample rooms added!");
        }
}
}