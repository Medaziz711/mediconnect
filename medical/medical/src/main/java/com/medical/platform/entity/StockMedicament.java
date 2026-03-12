package com.medical.platform.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "stock_medicaments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StockMedicament {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pharmacie_id", nullable = false)
    private Pharmacie pharmacie;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicament_id", nullable = false)
    private Medicament medicament;

    @Column(name = "quantite_disponible")
    private Integer quantiteDisponible = 0;

    @Column(name = "seuil_alerte")
    private Integer seuilAlerte = 10;

    @Column(name = "date_peremption")
    private LocalDate datePeremption;

    @Column(name = "prix_unitaire")
    private Float prixUnitaire;

    @Column(name = "emplacement", length = 100)
    private String emplacement;
}
