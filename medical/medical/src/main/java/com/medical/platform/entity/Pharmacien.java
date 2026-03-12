package com.medical.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "pharmaciens")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Pharmacien {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nom", length = 50)
    private String nom;

    @Column(name = "prenom", length = 50)
    private String prenom;

    @Column(name = "email", unique = true, nullable = false, length = 150)
    private String email;

    @Column(name = "mot_de_passe", nullable = false, length = 255)
    private String motDePasse;

    @Column(name = "telephone", length = 20)
    private String telephone;

    @Column(name = "adresse", columnDefinition = "TEXT")
    private String adresse;

    @Column(name = "date_inscription")
    private LocalDateTime dateInscription;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", length = 20)
    private StatutPharmacien statut = StatutPharmacien.en_attente;

    @Column(name = "numero_ordre", unique = true, nullable = false, length = 50)
    private String numeroOrdre;

    @Column(name = "notification_email")
    private Boolean notificationEmail;

    @Column(name = "genre", length = 10)
    private String genre;

    @Column(name = "profile_photo", length = 500)
    private String profilePhoto;

    @Column(name = "enabled")
    private Boolean enabled = false;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    public enum StatutPharmacien {
        en_attente, actif, rejete, PENDING, APPROVED, REJECTED
    }

    @PrePersist
    protected void onCreate() {
        if (dateInscription == null)
            dateInscription = LocalDateTime.now();
    }
}
