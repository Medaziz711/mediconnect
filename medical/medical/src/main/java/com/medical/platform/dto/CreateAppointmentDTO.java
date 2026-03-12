package com.medical.platform.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateAppointmentDTO {
    @NotNull(message = "Doctor ID is required")
    private Long doctorId;
    
    @NotNull(message = "Date and time is required")
    private LocalDateTime dateTime;
    
    @NotNull(message = "Duration is required")
    private Integer duration; // in minutes
    
    private String reason;
}



