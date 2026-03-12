package com.medical.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionDTO {
    private Long id;
    private LocalDate date;
    private LocalDate expirationDate;
    private Boolean renewable;
    private Long patientId;
    private String patientName;
    private Long doctorId;
    private String doctorName;
    private List<PrescriptionLineDTO> lines;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}



