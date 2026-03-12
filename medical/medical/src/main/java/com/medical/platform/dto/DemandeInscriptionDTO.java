package com.medical.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DemandeInscriptionDTO {
    private Long id;
    private Long userId;
    private String userEmail;
    private String userName;
    private String numeroOrdre;   // Matricule for doctor/pharmacist
    private String specialite;    // For doctors only
    private String roleDemande;   // DOCTOR, PHARMACIST
    private LocalDateTime dateDemande;
    private String statut;        // en_attente, acceptee, rejetee
    private String motifRejet;
}
