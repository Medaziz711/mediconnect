package com.medical.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordDTO {
    private Long id;
    private Long patientId;
    private String patientName;
    private String allergies;
    private String antecedents;
    private List<ConsultationDTO> consultations;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}



