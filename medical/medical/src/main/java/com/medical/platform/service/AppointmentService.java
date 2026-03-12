package com.medical.platform.service;

import com.medical.platform.dto.AppointmentDTO;
import com.medical.platform.dto.CreateAppointmentDTO;
import com.medical.platform.dto.CurrentUserDTO;
import com.medical.platform.entity.Medecin;
import com.medical.platform.entity.Patient;
import com.medical.platform.entity.RendezVous;
import com.medical.platform.repository.MedecinRepository;
import com.medical.platform.repository.PatientRepository;
import com.medical.platform.repository.RendezVousRepository;
import com.medical.platform.util.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AppointmentService {

    private final RendezVousRepository rendezVousRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final SecurityUtils securityUtils;

    public AppointmentService(RendezVousRepository rendezVousRepository, PatientRepository patientRepository,
                              MedecinRepository medecinRepository, SecurityUtils securityUtils) {
        this.rendezVousRepository = rendezVousRepository;
        this.patientRepository = patientRepository;
        this.medecinRepository = medecinRepository;
        this.securityUtils = securityUtils;
    }

    public AppointmentDTO createAppointment(CreateAppointmentDTO dto) {
        CurrentUserDTO currentUser = securityUtils.getCurrentUser();
        if (!"PATIENT".equals(currentUser.getRole())) {
            throw new RuntimeException("Only PATIENT can create appointments");
        }
        Patient patient = patientRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        Medecin medecin = medecinRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
        if (medecin.getStatut() != Medecin.StatutMedecin.actif) {
            throw new RuntimeException("Doctor account is not active");
        }
        RendezVous rv = new RendezVous();
        rv.setPatient(patient);
        rv.setMedecin(medecin);
        rv.setDateHeure(dto.getDateTime());
        rv.setDuree(dto.getDuration());
        rv.setMotif(dto.getReason());
        rv.setStatut(RendezVous.StatutRendezVous.en_attente);
        rv = rendezVousRepository.save(rv);
        return convertToDTO(rv);
    }

    public List<AppointmentDTO> getAppointmentsByPatient(Long patientId) {
        CurrentUserDTO currentUser = securityUtils.getCurrentUser();
        if ("PATIENT".equals(currentUser.getRole()) && !currentUser.getId().equals(patientId)) {
            throw new RuntimeException("You can only view your own appointments");
        }
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + patientId));
        return rendezVousRepository.findByPatientOrderByDateHeureDesc(patient).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<AppointmentDTO> getAppointmentsByDoctor(Long doctorId) {
        CurrentUserDTO currentUser = securityUtils.getCurrentUser();
        if ("DOCTOR".equals(currentUser.getRole()) && !currentUser.getId().equals(doctorId)) {
            throw new RuntimeException("You can only view your own appointments");
        }
        return rendezVousRepository.findByMedecinIdOrderByDateHeureDesc(doctorId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public AppointmentDTO confirmAppointment(Long id) {
        CurrentUserDTO currentUser = securityUtils.getCurrentUser();
        if (!"DOCTOR".equals(currentUser.getRole())) {
            throw new RuntimeException("Only DOCTOR can confirm appointments");
        }
        RendezVous rv = rendezVousRepository.findById(id).orElseThrow(() -> new RuntimeException("Appointment not found"));
        if (!rv.getMedecin().getId().equals(currentUser.getId())) {
            throw new RuntimeException("You can only confirm your own appointments");
        }
        if (rv.getStatut() == RendezVous.StatutRendezVous.annule) {
            throw new RuntimeException("Cannot confirm a cancelled appointment");
        }
        rv.setStatut(RendezVous.StatutRendezVous.confirme);
        rv = rendezVousRepository.save(rv);
        return convertToDTO(rv);
    }

    public AppointmentDTO cancelAppointment(Long id) {
        CurrentUserDTO currentUser = securityUtils.getCurrentUser();
        RendezVous rv = rendezVousRepository.findById(id).orElseThrow(() -> new RuntimeException("Appointment not found"));
        boolean isPatient = rv.getPatient().getId().equals(currentUser.getId());
        boolean isDoctor = rv.getMedecin().getId().equals(currentUser.getId());
        if (!isPatient && !isDoctor) {
            throw new RuntimeException("You can only cancel your own appointments");
        }
        rv.setStatut(RendezVous.StatutRendezVous.annule);
        rv = rendezVousRepository.save(rv);
        return convertToDTO(rv);
    }

    private AppointmentDTO convertToDTO(RendezVous rv) {
        AppointmentDTO dto = new AppointmentDTO();
        dto.setId(rv.getId());
        dto.setPatientId(rv.getPatient().getId());
        dto.setPatientName(rv.getPatient().getNom() + " " + rv.getPatient().getPrenom());
        dto.setDoctorId(rv.getMedecin().getId());
        dto.setDoctorName(rv.getMedecin().getNom() + " " + rv.getMedecin().getPrenom());
        dto.setDateTime(rv.getDateHeure());
        dto.setDuration(rv.getDuree());
        dto.setStatus(rv.getStatut().name());
        dto.setReason(rv.getMotif());
        dto.setNotes(null);
        dto.setCreatedAt(rv.getDateHeure());
        dto.setUpdatedAt(rv.getDateHeure());
        return dto;
    }
}
