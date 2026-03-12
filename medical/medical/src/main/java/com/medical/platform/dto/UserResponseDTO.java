package com.medical.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDTO {
    private Long id;
    private String name;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String address;
    private String role;
    private String statut; // EN_ATTENTE, ACTIF, REJETE
    private Boolean enabled;
    private String specialite;
    private String numeroOrdre;
    private LocalDateTime createdAt;
    private String gender;
    private String dateOfBirth;
    private String bloodGroup;
    private String profilePhoto;

    public UserResponseDTO(Long id, String name, String email, String phone, String address, String role, String statut,
            Boolean enabled, String specialite, String numeroOrdre, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.address = address;
        this.role = role;
        this.statut = statut;
        this.enabled = enabled;
        this.specialite = specialite;
        this.numeroOrdre = numeroOrdre;
        this.createdAt = createdAt;
    }
}
