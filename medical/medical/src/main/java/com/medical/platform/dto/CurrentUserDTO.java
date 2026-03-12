package com.medical.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CurrentUserDTO {
    private Long id;
    private String email;
    private String role; // ADMIN, PATIENT, DOCTOR, PHARMACIST
}
