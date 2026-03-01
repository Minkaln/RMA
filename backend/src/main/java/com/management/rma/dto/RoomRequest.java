package com.management.rma.dto;

public class RoomRequest {
    private Long roomId;
    private String requestMessage;

    // Default constructor for JSON parsing
    public RoomRequest() {}

    public RoomRequest(Long roomId, String requestMessage) {
        this.roomId = roomId;
        this.requestMessage = requestMessage;
    }

    // Getters and Setters
    public Long getRoomId() {
        return roomId;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }

    public String getRequestMessage() {
        return requestMessage;
    }

    public void setRequestMessage(String requestMessage) {
        this.requestMessage = requestMessage;
    }
}