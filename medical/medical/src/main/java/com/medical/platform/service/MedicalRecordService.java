package com.medical.platform.service;

import com.medical.platform.dto.ConsultationDTO;
import com.medical.platform.dto.MedicalRecordDTO;
import com.medical.platform.dto.UpdateMedicalRecordDTO;
import com.medical.platform.entity.Consultation;
import com.medical.platform.entity.DossierMedical;
import com.medical.platform.entity.Patient;
import com.medical.platform.repository.ConsultationRepository;
import com.medical.platform.repository.DossierMedicalRepository;
import com.medical.platform.repository.PatientRepository;
import com.medical.platform.util.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class MedicalRecordService {

    private final DossierMedicalRepository dossierMedicalRepository;
    private final PatientRepository patientRepository;
    private final ConsultationRepository consultationRepository;
    private final SecurityUtils securityUtils;

    public MedicalRecordService(DossierMedicalRepository dossierMedicalRepository,
                               PatientRepository patientRepository,
                               ConsultationRepository consultationRepository,
                               SecurityUtils securityUtils) {
        this.dossierMedicalRepository = dossierMedicalRepository;
        this.patientRepository = patientRepository;
        this.consultationRepository = consultationRepository;
        this.securityUtils = securityUtils;
    }

    public MedicalRecordDTO getMedicalRecordByPatient(Long patientId) {
        com.medical.platform.dto.CurrentUserDTO currentUser = securityUtils.getCurrentUser();
        if ("PATIENT".equals(currentUser.getRole()) && !currentUser.getId().equals(patientId)) {
            throw new RuntimeException("You can only view your own medical record");
        }
        if (!"PATIENT".equals(currentUser.getRole()) && !"DOCTOR".equals(currentUser.getRole())) {
            throw new RuntimeException("You don't have permission to view medical records");
        }
        Patient patient = patientRepository.findById(patientId).orElseThrow(() -> new RuntimeException("Patient not found"));
        List<DossierMedical> dossiers = dossierMedicalRepository.findByPatientId(patientId);
        DossierMedical dossier = dossiers.isEmpty() ? null : dossiers.get(0);
        if (dossier == null) {
            dossier = new DossierMedical();
            dossier.setPatient(patient);
            dossier = dossierMedicalRepository.save(dossier);
        }
        return convertToDTO(dossier, patientId);
    }

    public MedicalRecordDTO updateMedicalRecord(Long id, UpdateMedicalRecordDTO dto) {
        if (!"DOCTOR".equals(securityUtils.getCurrentUser().getRole())) {
            throw new RuntimeException("Only DOCTOR can update medical records");
        }
        DossierMedical dossier = dossierMedicalRepository.findById(id).orElseThrow(() -> new RuntimeException("Medical record not found"));
        if (dto.getAllergies() != null) dossier.setAllergies(dto.getAllergies());
        if (dto.getAntecedents() != null) dossier.setAntecedentsMedicaux(dto.getAntecedents());
        dossier = dossierMedicalRepository.save(dossier);
        return convertToDTO(dossier, dossier.getPatient().getId());
    }

    private MedicalRecordDTO convertToDTO(DossierMedical dossier, Long patientId) {
        MedicalRecordDTO dto = new MedicalRecordDTO();
        dto.setId(dossier.getId());
        dto.setPatientId(patientId);
        dto.setPatientName(dossier.getPatient().getNom() + " " + dossier.getPatient().getPrenom());
        dto.setAllergies(dossier.getAllergies());
        dto.setAntecedents(dossier.getAntecedentsMedicaux());
        dto.setCreatedAt(null);
        dto.setUpdatedAt(null);
        List<ConsultationDTO> cons = consultationRepository.findByDossierMedical_Patient_Id(patientId).stream()
                .map(this::toConsultationDTO).collect(Collectors.toList());
        dto.setConsultations(cons);
        return dto;
    }

    private ConsultationDTO toConsultationDTO(Consultation c) {
        ConsultationDTO dto = new ConsultationDTO();
        dto.setId(c.getId());
        dto.setDate(c.getDateConsultation() != null ? c.getDateConsultation().toLocalDate() : null);
        dto.setSymptoms(c.getSymptomes());
        dto.setDiagnosis(c.getDiagnostic());
        dto.setRecommendations(c.getRecommandations());
        dto.setAppointmentId(c.getRendezVous().getId());
        dto.setPatientId(c.getRendezVous().getPatient().getId());
        dto.setPatientName(c.getRendezVous().getPatient().getNom() + " " + c.getRendezVous().getPatient().getPrenom());
        dto.setDoctorId(c.getRendezVous().getMedecin().getId());
        dto.setDoctorName(c.getRendezVous().getMedecin().getNom() + " " + c.getRendezVous().getMedecin().getPrenom());
        return dto;
    }
}
