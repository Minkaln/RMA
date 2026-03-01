package com.management.rma.dto;

public class ReservationRequest {
    private Long roomId;
    private String guestName;
    private String phoneNumber;

    // Existing Getters and Setters
    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }

    public String getGuestName() { return guestName; }
    public void setGuestName(String guestName) { this.guestName = guestName; }

    // --- NEW GETTERS AND SETTERS ---
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

}