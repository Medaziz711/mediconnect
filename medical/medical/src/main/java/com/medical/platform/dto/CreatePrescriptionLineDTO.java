package com.medical.platform.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreatePrescriptionLineDTO {
    @NotNull(message = "Medicine ID is required")
    private Long medicineId;
    
    private String dosage;
    private String duration;
    private String instructions;
}



