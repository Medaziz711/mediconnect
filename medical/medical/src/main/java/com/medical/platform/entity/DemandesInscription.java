package com.medical.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "demandes_inscription")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DemandesInscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medecin_id")
    private Medecin medecin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pharmacien_id")
    private Pharmacien pharmacien;

    @Column(name = "date_demande")
    private LocalDateTime dateDemande = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id")
    private Admin admin;

    @Column(name = "date_traitement")
    private LocalDateTime dateTraitement;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    private StatutDemande statut = StatutDemande.en_attente;

    @Column(name = "motif_rejet", columnDefinition = "TEXT")
    private String motifRejet;

    @Column(name = "email_acceptation_envoye", nullable = false)
    private Boolean emailAcceptationEnvoye = false;

    @Column(name = "date_email_envoye")
    private LocalDateTime dateEmailEnvoye;

    public enum StatutDemande {
        en_attente, acceptee, rejetee
    }

    @PrePersist
    protected void onCreate() {
        if (dateDemande == null) dateDemande = LocalDateTime.now();
    }
}
