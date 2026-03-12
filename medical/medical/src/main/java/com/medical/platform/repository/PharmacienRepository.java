package com.medical.platform.repository;

import com.medical.platform.entity.Pharmacien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PharmacienRepository extends JpaRepository<Pharmacien, Long> {
    Optional<Pharmacien> findByEmail(String email);
    Optional<Pharmacien> findByNumeroOrdre(String numeroOrdre);
    boolean existsByEmail(String email);
    List<Pharmacien> findByStatut(Pharmacien.StatutPharmacien statut);
    List<Pharmacien> findByStatutIn(List<Pharmacien.StatutPharmacien> statuts);
}
