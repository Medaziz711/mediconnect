package com.medical.platform.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Login with email (Admin, Patient) or email/matricule (Doctor, Pharmacist).
 * For Doctor/Pharmacist: identifier can be email OR numero ordre (matricule).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequestDTO {
    
    @NotBlank(message = "Email or Matricule is required")
    private String email;  // Used as identifier: email for admin/patient, email OR matricule for doctor/pharmacist
    
    @NotBlank(message = "Password is required")
    private String password;

    private String role; // Optional: specify intended role (ADMIN, PATIENT, DOCTOR, PHARMACIST)
}
