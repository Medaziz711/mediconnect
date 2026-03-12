package com.medical.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "admins")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Admin {

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

    @Column(name = "date_inscription")
    private LocalDateTime dateInscription;

    @Column(name = "niveau_acces")
    private Integer niveauAcces = 1;

    @Column(name = "profile_photo", length = 500)
    private String profilePhoto;

    @PrePersist
    protected void onCreate() {
        if (dateInscription == null)
            dateInscription = LocalDateTime.now();
    }
}
