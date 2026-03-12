package com.medical.platform.repository;

import com.medical.platform.entity.Patient;
import com.medical.platform.entity.RendezVous;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RendezVousRepository extends JpaRepository<RendezVous, Long> {
    List<RendezVous> findByPatientOrderByDateHeureDesc(Patient patient);
    List<RendezVous> findByPatientIdOrderByDateHeureDesc(Long patientId);
    List<RendezVous> findByMedecinIdOrderByDateHeureDesc(Long medecinId);
}
