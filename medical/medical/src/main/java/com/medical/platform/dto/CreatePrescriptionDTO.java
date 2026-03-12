package com.medical.platform.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreatePrescriptionDTO {
    @NotNull(message = "Patient ID is required")
    private Long patientId;

    /** Consultation ID (required for new schema: ordonnance is linked to a consultation) */
    private Long consultationId;
    
    @NotNull(message = "Expiration date is required")
    private LocalDate expirationDate;
    
    private Boolean renewable = false;
    
    @NotNull(message = "Prescription lines are required")
    @Valid
    private List<CreatePrescriptionLineDTO> lines;
}



