package com.medical.platform.service;

import com.medical.platform.dto.*;
import com.medical.platform.entity.*;
import com.medical.platform.repository.ConsultationRepository;
import com.medical.platform.repository.MedicamentRepository;
import com.medical.platform.repository.OrdonnanceRepository;
import com.medical.platform.util.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PrescriptionService {

    private final OrdonnanceRepository ordonnanceRepository;
    private final ConsultationRepository consultationRepository;
    private final MedicamentRepository medicamentRepository;
    private final SecurityUtils securityUtils;

    public PrescriptionService(OrdonnanceRepository ordonnanceRepository,
                               ConsultationRepository consultationRepository,
                               MedicamentRepository medicamentRepository,
                               SecurityUtils securityUtils) {
        this.ordonnanceRepository = ordonnanceRepository;
        this.consultationRepository = consultationRepository;
        this.medicamentRepository = medicamentRepository;
        this.securityUtils = securityUtils;
    }

    public PrescriptionDTO createPrescription(CreatePrescriptionDTO dto) {
        com.medical.platform.dto.CurrentUserDTO currentUser = securityUtils.getCurrentUser();
        if (!"DOCTOR".equals(currentUser.getRole())) {
            throw new RuntimeException("Only DOCTOR can create prescriptions");
        }
        Consultation consultation = dto.getConsultationId() != null
                ? consultationRepository.findById(dto.getConsultationId()).orElseThrow(() -> new RuntimeException("Consultation not found"))
                : null;
        if (consultation == null) {
            throw new RuntimeException("Consultation ID is required to create an ordonnance");
        }
        if (!consultation.getRendezVous().getPatient().getId().equals(dto.getPatientId())) {
            throw new RuntimeException("Patient does not match consultation");
        }
        if (!consultation.getRendezVous().getMedecin().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only create prescriptions for your own consultations");
        }
        Ordonnance ord = new Ordonnance();
        ord.setConsultation(consultation);
        ord.setDateEmission(LocalDate.now());
        ord.setDateExpiration(dto.getExpirationDate());
        ord.setRenouvelable(dto.getRenewable() != null ? dto.getRenewable() : false);
        ord.setStatut(Ordonnance.StatutOrdonnance.validee);
        for (CreatePrescriptionLineDTO lineDto : dto.getLines()) {
            Medicament medicament = medicamentRepository.findById(lineDto.getMedicineId())
                    .orElseThrow(() -> new RuntimeException("Medicament not found: " + lineDto.getMedicineId()));
            LigneOrdonnance line = new LigneOrdonnance();
            line.setOrdonnance(ord);
            line.setMedicament(medicament);
            line.setPosologie(lineDto.getDosage());
            line.setDureeTraitement(lineDto.getDuration() != null ? parseIntSafe(lineDto.getDuration()) : null);
            line.setInstructions(lineDto.getInstructions());
            ord.getLignes().add(line);
        }
        ord = ordonnanceRepository.save(ord);
        return convertToDTO(ord);
    }

    private static Integer parseIntSafe(String s) {
        if (s == null) return null;
        try { return Integer.parseInt(s.replaceAll("[^0-9]", "")); } catch (Exception e) { return null; }
    }

    public List<PrescriptionDTO> getPrescriptionsByPatient(Long patientId) {
        com.medical.platform.dto.CurrentUserDTO currentUser = securityUtils.getCurrentUser();
        if ("PATIENT".equals(currentUser.getRole()) && !currentUser.getId().equals(patientId)) {
            throw new RuntimeException("You can only view your own prescriptions");
        }
        return ordonnanceRepository.findByConsultation_RendezVous_Patient_IdOrderByDateEmissionDesc(patientId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<PrescriptionDTO> getPrescriptionsByDoctor(Long doctorId) {
        com.medical.platform.dto.CurrentUserDTO currentUser = securityUtils.getCurrentUser();
        if ("DOCTOR".equals(currentUser.getRole()) && !currentUser.getId().equals(doctorId)) {
            throw new RuntimeException("You can only view your own prescriptions");
        }
        return ordonnanceRepository.findByConsultation_RendezVous_Medecin_IdOrderByDateEmissionDesc(doctorId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<PrescriptionDTO> getAllPrescriptionsForPharmacist() {
        if (!"PHARMACIST".equals(securityUtils.getCurrentUser().getRole())) {
            throw new RuntimeException("Only PHARMACIST can view all prescriptions");
        }
        return ordonnanceRepository.findAll().stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    private PrescriptionDTO convertToDTO(Ordonnance ord) {
        PrescriptionDTO dto = new PrescriptionDTO();
        dto.setId(ord.getId());
        dto.setDate(ord.getDateEmission());
        dto.setExpirationDate(ord.getDateExpiration());
        dto.setRenewable(ord.getRenouvelable());
        dto.setPatientId(ord.getConsultation().getRendezVous().getPatient().getId());
        dto.setPatientName(ord.getConsultation().getRendezVous().getPatient().getNom() + " " + ord.getConsultation().getRendezVous().getPatient().getPrenom());
        dto.setDoctorId(ord.getConsultation().getRendezVous().getMedecin().getId());
        dto.setDoctorName(ord.getConsultation().getRendezVous().getMedecin().getNom() + " " + ord.getConsultation().getRendezVous().getMedecin().getPrenom());
        dto.setCreatedAt(ord.getDateEmission() != null ? ord.getDateEmission().atStartOfDay() : null);
        dto.setUpdatedAt(ord.getDateEmission() != null ? ord.getDateEmission().atStartOfDay() : null);
        dto.setLines(ord.getLignes().stream().map(this::convertLineToDTO).collect(Collectors.toList()));
        return dto;
    }

    private PrescriptionLineDTO convertLineToDTO(LigneOrdonnance line) {
        PrescriptionLineDTO dto = new PrescriptionLineDTO();
        dto.setId(line.getId());
        dto.setDosage(line.getPosologie());
        dto.setDuration(line.getDureeTraitement() != null ? String.valueOf(line.getDureeTraitement()) : null);
        dto.setInstructions(line.getInstructions());
        dto.setMedicineId(line.getMedicament().getId());
        dto.setMedicineName(line.getMedicament().getNom());
        dto.setMedicineForm(line.getMedicament().getForme());
        dto.setMedicineDosage(line.getMedicament().getDosage());
        return dto;
    }
}
