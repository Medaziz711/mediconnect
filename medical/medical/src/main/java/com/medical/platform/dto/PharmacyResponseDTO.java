package com.medical.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PharmacyResponseDTO {
    private Long id;
    private String name; // Pharmacist name
    private String email;
    private String pharmacyName;
    private String address;
    private String phone;
    private String role;
    private String statut;
    private Double latitude;
    private Double longitude;
    private Double distance; // Distance in km from user
    private Boolean ouvert24h;
}
