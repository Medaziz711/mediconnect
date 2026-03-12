package com.medical.platform.repository;

import com.medical.platform.entity.Consultation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConsultationRepository extends JpaRepository<Consultation, Long> {
    Optional<Consultation> findByRendezVousId(Long rendezVousId);
    List<Consultation> findByDossierMedical_Patient_Id(Long patientId);
    List<Consultation> findByRendezVous_Medecin_Id(Long medecinId);
}
