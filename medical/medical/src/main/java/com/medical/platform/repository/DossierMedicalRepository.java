package com.medical.platform.repository;

import com.medical.platform.entity.DossierMedical;
import com.medical.platform.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DossierMedicalRepository extends JpaRepository<DossierMedical, Long> {
    List<DossierMedical> findByPatient(Patient patient);
    List<DossierMedical> findByPatientId(Long patientId);
}
