package com.medical.platform.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateConsultationDTO {
    @NotNull(message = "Appointment ID is required")
    private Long appointmentId;
    
    private String symptoms;
    private String diagnosis;
    private String recommendations;
}



