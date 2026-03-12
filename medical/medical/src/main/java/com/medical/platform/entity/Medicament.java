package com.medical.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "medicaments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Medicament {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nom", length = 100)
    private String nom;

    @Column(name = "nom_commercial", length = 100)
    private String nomCommercial;

    @Column(name = "dci", length = 100)
    private String dci;

    @Column(name = "forme", length = 50)
    private String forme;

    @Column(name = "dosage", length = 50)
    private String dosage;

    @Column(name = "fabricant", length = 100)
    private String fabricant;

    @Column(name = "generique")
    private Boolean generique;

    @Column(name = "contre_indications", columnDefinition = "TEXT")
    private String contreIndications;
}
