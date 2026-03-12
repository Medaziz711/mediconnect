package com.medical.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "consultations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Consultation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rendez_vous_id", nullable = false, unique = true)
    private RendezVous rendezVous;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_medical_id", nullable = false)
    private DossierMedical dossierMedical;

    @Column(name = "date_consultation")
    private LocalDateTime dateConsultation;

    @Column(name = "motif", columnDefinition = "TEXT")
    private String motif;

    @Column(name = "symptomes", columnDefinition = "TEXT")
    private String symptomes;

    @Column(name = "diagnostic", columnDefinition = "TEXT")
    private String diagnostic;

    @Column(name = "notes_privees", columnDefinition = "TEXT")
    private String notesPrivees;

    @Column(name = "recommandations", columnDefinition = "TEXT")
    private String recommandations;
}
