package com.medical.platform.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class DoctorResponseDTO extends UserResponseDTO {
    private String specialite;
    private String numeroOrdre;
    private Double rating;
    private Integer totalReviews;

    private Integer experienceYears;
    private Float consultationFee;
    private String languagesSpoken;

    public DoctorResponseDTO(Long id, String name, String email, String phone, String address, String role,
            String statut, Boolean enabled, java.time.LocalDateTime createdAt, String specialite, String numeroOrdre) {
        super(id, name, email, phone, address, role, statut, enabled, specialite, numeroOrdre, createdAt);
        this.specialite = specialite;
        this.numeroOrdre = numeroOrdre;
        this.rating = 4.5; // Default for now
        this.totalReviews = 10; // Default for now
    }
}
