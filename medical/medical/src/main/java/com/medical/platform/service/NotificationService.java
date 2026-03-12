package com.medical.platform.service;

import com.medical.platform.dto.CurrentUserDTO;
import com.medical.platform.dto.DoctorNotificationDTO;
import com.medical.platform.entity.Medecin;
import com.medical.platform.entity.MedicineRequestNotification;
import com.medical.platform.entity.Patient;
import com.medical.platform.repository.MedicineRequestNotificationRepository;
import com.medical.platform.repository.MedecinRepository;
import com.medical.platform.repository.PatientRepository;
import com.medical.platform.repository.RendezVousRepository;
import com.medical.platform.util.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationService {

    private final MedicineRequestNotificationRepository notificationRepository;
    private final SecurityUtils securityUtils;
    private final RendezVousRepository rendezVousRepository;
    private final MedecinRepository medecinRepository;
    private final PatientRepository patientRepository;

    public NotificationService(MedicineRequestNotificationRepository notificationRepository,
                              SecurityUtils securityUtils,
                              RendezVousRepository rendezVousRepository,
                              MedecinRepository medecinRepository,
                              PatientRepository patientRepository) {
        this.notificationRepository = notificationRepository;
        this.securityUtils = securityUtils;
        this.rendezVousRepository = rendezVousRepository;
        this.medecinRepository = medecinRepository;
        this.patientRepository = patientRepository;
    }

    public List<DoctorNotificationDTO> getUnreadNotificationsForDoctor() {
        Medecin doctor = getDoctorMedecin();
        List<MedicineRequestNotification> notifications =
                notificationRepository.findByMedecinAndReadFalseOrderByCreatedAtDesc(doctor);
        return notifications.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<DoctorNotificationDTO> getAllNotificationsForDoctor() {
        Medecin doctor = getDoctorMedecin();
        List<MedicineRequestNotification> unread =
                notificationRepository.findByMedecinAndReadOrderByCreatedAtDesc(doctor, false);
        List<MedicineRequestNotification> read =
                notificationRepository.findByMedecinAndReadOrderByCreatedAtDesc(doctor, true);
        List<DoctorNotificationDTO> out = new ArrayList<>();
        unread.stream().map(this::convertToDTO).forEach(out::add);
        read.stream().map(this::convertToDTO).forEach(out::add);
        return out;
    }

    public void markNotificationAsRead(Long notificationId) {
        CurrentUserDTO currentUser = securityUtils.getCurrentUser();
        Medecin doctor = getDoctorMedecin();
        MedicineRequestNotification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (notification.getMedecin() == null || !notification.getMedecin().getId().equals(doctor.getId())) {
            throw new RuntimeException("You can only mark your own notifications as read");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    private DoctorNotificationDTO convertToDTO(MedicineRequestNotification n) {
        DoctorNotificationDTO dto = new DoctorNotificationDTO();
        dto.setNotificationId(n.getId());
        dto.setMedicineName(n.getMedicineName());
        dto.setPatientName(n.getPatient().getNom() + " " + n.getPatient().getPrenom());
        dto.setPatientId(n.getPatient().getId());
        dto.setMessage(n.getMessage());
        dto.setCreatedAt(n.getCreatedAt());
        return dto;
    }

    private Medecin getDoctorMedecin() {
        CurrentUserDTO currentUser = securityUtils.getCurrentUser();
        if ("DOCTOR".equals(currentUser.getRole())) {
            return medecinRepository.findById(currentUser.getId())
                    .orElseThrow(() -> new RuntimeException("Medecin not found"));
        }
        if ("PATIENT".equals(currentUser.getRole())) {
            List<com.medical.platform.entity.RendezVous> rvs = rendezVousRepository.findByPatientIdOrderByDateHeureDesc(currentUser.getId());
            if (!rvs.isEmpty()) {
                return rvs.get(0).getMedecin();
            }
        }
        throw new RuntimeException("Doctor not found. Log in as doctor or ensure you have appointments.");
    }
}
