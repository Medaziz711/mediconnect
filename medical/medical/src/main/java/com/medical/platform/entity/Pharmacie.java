package com.medical.platform.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pharmacies")
@Data
@NoArgsConstructor
// NOTE: @AllArgsConstructor removed — it bypasses field initializers
// (ouvert24h = false, stockMedicaments = new ArrayList<>())
// and conflicts with @PrePersist logic.
public class Pharmacie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pharmacien_id", nullable = false)
    private Pharmacien pharmacien;

    @Column(name = "nom", length = 200)
    private String nom;

    // Legacy column mapping to satisfy database NOT NULL constraint from an older
    // schema version
    @Column(name = "name", length = 200)
    private String name;

    // nullable = false enforces the schema constraint in JPA.
    // @PrePersist below guarantees a fallback so this is never null at save time.
    @Column(name = "adresse", columnDefinition = "TEXT", nullable = false)
    private String adresse;

    // Legacy column mapping to satisfy database NOT NULL constraint from an older
    // schema version
    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "telephone", length = 20)
    private String telephone;

    @Column(name = "horaires_ouverture", columnDefinition = "TEXT")
    private String horairesOuverture;

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "ouvert_24h")
    private Boolean ouvert24h = false;

    // Legacy column mapping to satisfy database NOT NULL constraint from an older
    // schema version
    @Column(name = "open_24h")
    private Boolean open24h;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }

        // Sync legacy name column to satisfy lingering DB constraint
        if (name == null) {
            name = nom;
        }

        // Nuclear fallback: adresse must NEVER be null (DB constraint)
        if (adresse == null || adresse.trim().isEmpty()) {
            adresse = "Adresse à préciser";
        }
        // Sync legacy address column to satisfy lingering DB constraint
        if (address == null) {
            address = adresse;
        }
        // Ensure ouvert24h defaults to false
        if (ouvert24h == null) {
            ouvert24h = false;
        }

        // Sync legacy open_24h column to satisfy lingering DB constraint
        if (open24h == null) {
            open24h = ouvert24h;
        }
    }

    @OneToMany(mappedBy = "pharmacie", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StockMedicament> stockMedicaments = new ArrayList<>();
}
