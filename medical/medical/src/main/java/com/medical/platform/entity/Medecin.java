package com.medical.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "medecins")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Medecin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nom", nullable = false, length = 100)
    private String nom;

    @Column(name = "prenom", nullable = false, length = 100)
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
    private StatutMedecin statut = StatutMedecin.en_attente;

    @Column(name = "specialite", length = 100)
    private String specialite;

    @Column(name = "numero_ordre", unique = true, nullable = false, length = 50)
    private String numeroOrdre;

    @Column(name = "horaires_dispo", columnDefinition = "TEXT")
    private String horairesDispo;

    @Column(name = "jours_consultation", columnDefinition = "TEXT")
    private String joursConsultation;

    @Column(name = "tarif_consultation")
    private Float tarifConsultation;

    @Column(name = "notification_email", length = 150)
    private String notificationEmail;

    @Column(name = "annees_experience")
    private Integer anneesExperience;

    @Column(name = "langues_parlees")
    private String languesParlees;

    @Column(name = "sexe", length = 20)
    private String sexe;

    @Column(name = "date_naissance")
    private java.time.LocalDate dateNaissance;

    @Column(name = "groupe_sanguin", length = 10)
    private String groupeSanguin;

    @Column(name = "profile_photo", length = 500)
    private String profilePhoto;

    @Column(name = "enabled")
    private Boolean enabled = false;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    public enum StatutMedecin {
        en_attente, actif, rejete, PENDING, APPROVED, REJECTED
    }

    @PrePersist
    protected void onCreate() {
        if (dateInscription == null)
            dateInscription = LocalDateTime.now();
    }
}
