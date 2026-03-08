package com.management.rma.dto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;

public class RoomRequest {
    @Getter
    private Long roomId;
    private String requestMessage;

    // Default constructor for JSON parsing
    public RoomRequest() {}

    public RoomRequest(Long roomId, String requestMessage) {
        this.roomId = roomId;
        this.requestMessage = requestMessage;
    }

    public void setRoomId(Long roomId) {
        this.roomId = roomId;
    }
    @JsonProperty("requestMessage")
    public String getRequestMessage() {
        return requestMessage;
    }

    public void setRequestMessage(String requestMessage) {
        this.requestMessage = requestMessage;
    }

}