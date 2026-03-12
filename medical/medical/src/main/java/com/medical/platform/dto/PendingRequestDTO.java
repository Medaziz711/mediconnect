package com.medical.platform.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class PendingRequestDTO {
    private Long userId;
    private String fullName;
    private String email;
    private String role; // "DOCTOR" or "PHARMACIST"
    private String licenseNumber;
    private String specialization; // for doctors
    private String pharmacyName; // for pharmacists
    private LocalDateTime submissionDate;
}
