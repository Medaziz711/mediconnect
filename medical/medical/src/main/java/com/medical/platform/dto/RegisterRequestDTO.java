package com.medical.platform.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequestDTO {

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 50, message = "Email must not exceed 50 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 120, message = "Password must be between 6 and 120 characters")
    private String password;

    private String phone;

    private String address;

    @NotBlank(message = "Role is required")
    private String role; // PATIENT, DOCTOR, PHARMACIST

    // Optional fields for specific roles
    private String dateOfBirth; // For PATIENT
    private String bloodGroup; // For PATIENT
    private String medicalHistory; // For PATIENT
    private String specialization; // For DOCTOR
    private String licenseNumber; // For DOCTOR, PHARMACIST (will use as matricule)
    private String yearsOfExperience; // For DOCTOR, PHARMACIST
    private String qualifications; // For DOCTOR, PHARMACIST

    // New fields for enhanced registration
    private String matricule; // Alternative to licenseNumber

    // Pharmacy details for PHARMACIST
    private String pharmacyName;
    private String pharmacyAddress;
    private String pharmacyPhone;
    private Float latitude;
    private Float longitude;
    private boolean open24Hours;
}
