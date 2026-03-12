package com.medical.platform.repository;

import com.medical.platform.entity.Medecin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedecinRepository extends JpaRepository<Medecin, Long> {
    Optional<Medecin> findByEmail(String email);
    Optional<Medecin> findByNumeroOrdre(String numeroOrdre);
    boolean existsByEmail(String email);
    List<Medecin> findByStatut(Medecin.StatutMedecin statut);
    List<Medecin> findByStatutIn(List<Medecin.StatutMedecin> statuts);
}
