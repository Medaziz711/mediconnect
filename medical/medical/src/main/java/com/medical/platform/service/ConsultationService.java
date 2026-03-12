package com.medical.platform.service;

import com.medical.platform.dto.ConsultationDTO;
import com.medical.platform.dto.CreateConsultationDTO;
import com.medical.platform.dto.CurrentUserDTO;
import com.medical.platform.entity.Consultation;
import com.medical.platform.entity.DossierMedical;
import com.medical.platform.entity.RendezVous;
import com.medical.platform.repository.ConsultationRepository;
import com.medical.platform.repository.DossierMedicalRepository;
import com.medical.platform.repository.RendezVousRepository;
import com.medical.platform.util.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ConsultationService {

    private final ConsultationRepository consultationRepository;
    private final RendezVousRepository rendezVousRepository;
    private final DossierMedicalRepository dossierMedicalRepository;
    private final SecurityUtils securityUtils;

    public ConsultationService(ConsultationRepository consultationRepository,
                               RendezVousRepository rendezVousRepository,
                               DossierMedicalRepository dossierMedicalRepository,
                               SecurityUtils securityUtils) {
        this.consultationRepository = consultationRepository;
        this.rendezVousRepository = rendezVousRepository;
        this.dossierMedicalRepository = dossierMedicalRepository;
        this.securityUtils = securityUtils;
    }

    public ConsultationDTO createConsultation(CreateConsultationDTO dto) {
        CurrentUserDTO currentUser = securityUtils.getCurrentUser();
        if (!"DOCTOR".equals(currentUser.getRole())) {
            throw new RuntimeException("Only DOCTOR can create consultations");
        }
        RendezVous rv = rendezVousRepository.findById(dto.getAppointmentId())
                .orElseThrow(() -> new RuntimeException("Rendez-vous not found"));
        if (!rv.getMedecin().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only create consultations for your own appointments");
        }
        if (consultationRepository.findByRendezVousId(rv.getId()).isPresent()) {
            throw new RuntimeException("Consultation already exists for this rendez-vous");
        }
        List<DossierMedical> dossiers = dossierMedicalRepository.findByPatientId(rv.getPatient().getId());
        DossierMedical dossier = dossiers.isEmpty() ? null : dossiers.get(0);
        if (dossier == null) {
            dossier = new DossierMedical();
            dossier.setPatient(rv.getPatient());
            dossier = dossierMedicalRepository.save(dossier);
        }
        Consultation c = new Consultation();
        c.setRendezVous(rv);
        c.setDossierMedical(dossier);
        c.setSymptomes(dto.getSymptoms());
        c.setDiagnostic(dto.getDiagnosis());
        c.setRecommandations(dto.getRecommendations());
        c.setDateConsultation(java.time.LocalDateTime.now());
        c = consultationRepository.save(c);
        return convertToDTO(c);
    }

    public List<ConsultationDTO> getConsultationsByPatient(Long patientId) {
        CurrentUserDTO currentUser = securityUtils.getCurrentUser();
        if ("PATIENT".equals(currentUser.getRole()) && !currentUser.getId().equals(patientId)) {
            throw new RuntimeException("You can only view your own consultations");
        }
        return consultationRepository.findByDossierMedical_Patient_Id(patientId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ConsultationDTO> getConsultationsByDoctor(Long doctorId) {
        CurrentUserDTO currentUser = securityUtils.getCurrentUser();
        if ("DOCTOR".equals(currentUser.getRole()) && !currentUser.getId().equals(doctorId)) {
            throw new RuntimeException("You can only view your own consultations");
        }
        return consultationRepository.findByRendezVous_Medecin_Id(doctorId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    ConsultationDTO convertToDTO(Consultation c) {
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
        dto.setCreatedAt(c.getDateConsultation());
        dto.setUpdatedAt(c.getDateConsultation());
        return dto;
    }
}
