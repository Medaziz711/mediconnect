package com.medical.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorNotificationDTO {
    private Long notificationId;
    private String medicineName;
    private String patientName;
    private Long patientId;
    private String message;
    private LocalDateTime createdAt;
}
