package com.medical.platform.dto;

import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class PharmacistRegistrationRequest {

    // Frontend sends 'name' (single full name field)
    @NotBlank(message = "Name is required")
    private String name;

    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    private String email;

    @Size(min = 6, message = "Password must be at least 6 characters")
    @NotBlank(message = "Password is required")
    private String password;

    private String phone; // Optional

    // Personal address of the pharmacist
    private String address;

    // Frontend sends 'matricule' (not 'licenseNumber')
    private String matricule; // Optional - will be auto-generated if missing

    @NotBlank(message = "Pharmacy name is required")
    private String pharmacyName;

    @NotBlank(message = "Pharmacy address is required")
    private String pharmacyAddress;

    private Double latitude; // Optional
    private Double longitude; // Optional
    private boolean open24Hours; // Defaults to false
    private String pharmacyPhone; // Optional
}
