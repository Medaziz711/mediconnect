package com.medical.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "patients")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Patient {

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

    @Column(name = "num_securite_sociale", length = 50)
    private String numSecuriteSociale;

    @Column(name = "date_naissance")
    private LocalDate dateNaissance;

    @Column(name = "groupe_sanguin", length = 5)
    private String groupeSanguin;

    @Column(name = "allergies", columnDefinition = "TEXT")
    private String allergies;

    @Column(name = "antecedents", columnDefinition = "TEXT")
    private String antecedents;

    @Column(name = "verified")
    private Boolean verified = false;

    @Column(name = "profile_photo", length = 500)
    private String profilePhoto;

    public boolean isVerified() {
        return verified != null && verified;
    }

    @PrePersist
    protected void onCreate() {
        if (dateInscription == null)
            dateInscription = LocalDateTime.now();
    }
}
