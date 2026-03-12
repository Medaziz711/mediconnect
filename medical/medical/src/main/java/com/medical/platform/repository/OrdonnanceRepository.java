package com.medical.platform.repository;

import com.medical.platform.entity.Ordonnance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrdonnanceRepository extends JpaRepository<Ordonnance, Long> {
    List<Ordonnance> findByConsultation_RendezVous_Patient_IdOrderByDateEmissionDesc(Long patientId);
    List<Ordonnance> findByConsultation_RendezVous_Medecin_IdOrderByDateEmissionDesc(Long medecinId);
}
