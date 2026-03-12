package com.medical.platform.service;

import com.medical.platform.dto.DemandeInscriptionDTO;
import com.medical.platform.dto.UserResponseDTO;
import com.medical.platform.entity.*;
import com.medical.platform.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import lombok.extern.slf4j.Slf4j;
import java.util.Comparator;

@Service
@Transactional
@Slf4j
public class AdminService {

    private final DemandesInscriptionRepository demandesInscriptionRepository;
    private final AdminRepository adminRepository;
    private final MedecinRepository medecinRepository;
    private final PharmacienRepository pharmacienRepository;
    private final PatientRepository patientRepository;
    private final PharmacieRepository pharmacieRepository;
    private final EmailNotificationService emailNotificationService;

    public AdminService(DemandesInscriptionRepository demandesInscriptionRepository,
            AdminRepository adminRepository,
            MedecinRepository medecinRepository,
            PharmacienRepository pharmacienRepository,
            PatientRepository patientRepository,
            PharmacieRepository pharmacieRepository,
            EmailNotificationService emailNotificationService) {
        this.demandesInscriptionRepository = demandesInscriptionRepository;
        this.adminRepository = adminRepository;
        this.medecinRepository = medecinRepository;
        this.pharmacienRepository = pharmacienRepository;
        this.patientRepository = patientRepository;
        this.pharmacieRepository = pharmacieRepository;
        this.emailNotificationService = emailNotificationService;
    }

    public List<DemandeInscriptionDTO> getPendingDemandes() {
        List<DemandesInscription> list = demandesInscriptionRepository
                .findByStatutOrderByDateDemandeDesc(DemandesInscription.StatutDemande.en_attente);
        return list.stream().map(this::toDTO).collect(Collectors.toList());
    }

    private DemandeInscriptionDTO toDTO(DemandesInscription d) {
        DemandeInscriptionDTO dto = new DemandeInscriptionDTO();
        dto.setId(d.getId());
        if (d.getMedecin() != null) {
            dto.setUserId(d.getMedecin().getId());
            dto.setUserEmail(d.getMedecin().getEmail());
            dto.setUserName(d.getMedecin().getNom() + " " + d.getMedecin().getPrenom());
            dto.setNumeroOrdre(d.getMedecin().getNumeroOrdre());
            dto.setSpecialite(d.getMedecin().getSpecialite());
            dto.setRoleDemande("DOCTOR");
        } else if (d.getPharmacien() != null) {
            dto.setUserId(d.getPharmacien().getId());
            dto.setUserEmail(d.getPharmacien().getEmail());
            dto.setUserName(d.getPharmacien().getNom() + " " + d.getPharmacien().getPrenom());
            dto.setNumeroOrdre(d.getPharmacien().getNumeroOrdre());
            dto.setRoleDemande("PHARMACIST");
        }
        dto.setDateDemande(d.getDateDemande());
        dto.setStatut(d.getStatut().name());
        dto.setMotifRejet(d.getMotifRejet());
        return dto;
    }

    public void acceptDemande(Long demandeId, Long adminId) {
        DemandesInscription demande = demandesInscriptionRepository.findById(demandeId)
                .orElseThrow(() -> new RuntimeException("Demande not found: " + demandeId));
        if (demande.getStatut() != DemandesInscription.StatutDemande.en_attente) {
            throw new RuntimeException("Demande already processed");
        }
        Admin admin = adminRepository.findById(adminId).orElseThrow(() -> new RuntimeException("Admin not found"));

        demande.setStatut(DemandesInscription.StatutDemande.acceptee);
        demande.setAdmin(admin);
        demande.setDateTraitement(LocalDateTime.now());

        if (demande.getMedecin() != null) {
            Medecin m = demande.getMedecin();
            m.setStatut(Medecin.StatutMedecin.actif);
            medecinRepository.save(m);
            emailNotificationService.sendInscriptionAcceptee(m.getEmail(), m.getNom() + " " + m.getPrenom());
        }
        if (demande.getPharmacien() != null) {
            Pharmacien p = demande.getPharmacien();
            p.setStatut(Pharmacien.StatutPharmacien.actif);
            pharmacienRepository.save(p);
            emailNotificationService.sendInscriptionAcceptee(p.getEmail(), p.getNom() + " " + p.getPrenom());
        }

        demande.setEmailAcceptationEnvoye(true);
        demande.setDateEmailEnvoye(LocalDateTime.now());
        demandesInscriptionRepository.save(demande);
    }

    public void rejectDemande(Long demandeId, Long adminId, String motifRejet) {
        DemandesInscription demande = demandesInscriptionRepository.findById(demandeId)
                .orElseThrow(() -> new RuntimeException("Demande not found: " + demandeId));
        if (demande.getStatut() != DemandesInscription.StatutDemande.en_attente) {
            throw new RuntimeException("Demande already processed");
        }
        Admin admin = adminRepository.findById(adminId).orElseThrow(() -> new RuntimeException("Admin not found"));

        demande.setStatut(DemandesInscription.StatutDemande.rejetee);
        demande.setAdmin(admin);
        demande.setDateTraitement(LocalDateTime.now());
        demande.setMotifRejet(motifRejet);

        if (demande.getMedecin() != null) {
            Medecin m = demande.getMedecin();
            m.setStatut(Medecin.StatutMedecin.rejete);
            medecinRepository.save(m);
            emailNotificationService.sendInscriptionRejetee(m.getEmail(), m.getNom() + " " + m.getPrenom(), motifRejet);
        }
        if (demande.getPharmacien() != null) {
            Pharmacien p = demande.getPharmacien();
            p.setStatut(Pharmacien.StatutPharmacien.rejete);
            pharmacienRepository.save(p);
            emailNotificationService.sendInscriptionRejetee(p.getEmail(), p.getNom() + " " + p.getPrenom(), motifRejet);
        }

        demande.setEmailAcceptationEnvoye(true);
        demande.setDateEmailEnvoye(LocalDateTime.now());
        demandesInscriptionRepository.save(demande);
    }

    public List<UserResponseDTO> getAllUsers() {
        List<UserResponseDTO> allUsers = new ArrayList<>();

        // Add Admins
        adminRepository.findAll().forEach(a -> {
            allUsers.add(new UserResponseDTO(a.getId(), a.getNom() + " " + a.getPrenom(), a.getEmail(),
                    a.getTelephone(), null, "ADMIN", "ACTIF", true, null, null, a.getDateInscription()));
        });

        // Add Patients
        patientRepository.findAll().forEach(p -> {
            allUsers.add(new UserResponseDTO(p.getId(), p.getNom() + " " + p.getPrenom(), p.getEmail(),
                    p.getTelephone(), p.getAdresse(), "PATIENT", "ACTIF", true, null, null, p.getDateInscription()));
        });

        // Add Medecins
        medecinRepository.findAll().forEach(m -> {
            UserResponseDTO dto = new UserResponseDTO(m.getId(), m.getNom() + " " + m.getPrenom(), m.getEmail(),
                    m.getTelephone(), m.getAdresse(), "DOCTOR", m.getStatut().name(), true, m.getSpecialite(),
                    m.getNumeroOrdre(), m.getDateInscription());
            allUsers.add(dto);
        });

        // Add Pharmaciens
        pharmacienRepository.findAll().forEach(ph -> {
            allUsers.add(new UserResponseDTO(ph.getId(), ph.getNom() + " " + ph.getPrenom(), ph.getEmail(),
                    ph.getTelephone(), ph.getAdresse(), "PHARMACIST", ph.getStatut().name(), true, null,
                    ph.getNumeroOrdre(), ph.getDateInscription()));
        });

        return allUsers;
    }

    public void deleteUser(Long id, String role) {
        switch (role.toUpperCase()) {
            case "ADMIN":
                adminRepository.deleteById(id);
                break;
            case "PATIENT":
                patientRepository.deleteById(id);
                break;
            case "DOCTOR":
                // Also delete related demandes_inscription
                List<DemandesInscription> demandsM = demandesInscriptionRepository.findAll().stream()
                        .filter(d -> d.getMedecin() != null && d.getMedecin().getId().equals(id))
                        .collect(Collectors.toList());
                demandesInscriptionRepository.deleteAll(demandsM);
                medecinRepository.deleteById(id);
                break;
            case "PHARMACIST":
                // Also delete related demandes_inscription
                List<DemandesInscription> demandsP = demandesInscriptionRepository.findAll().stream()
                        .filter(d -> d.getPharmacien() != null && d.getPharmacien().getId().equals(id))
                        .collect(Collectors.toList());
                demandesInscriptionRepository.deleteAll(demandsP);
                pharmacienRepository.deleteById(id);
                break;
            default:
                throw new RuntimeException("Invalid role: " + role);
        }
    }

    public List<com.medical.platform.dto.PendingRequestDTO> getPendingRequests(String role) {
        List<com.medical.platform.dto.PendingRequestDTO> requests = new ArrayList<>();

        boolean fetchDoctors = role == null || role.equalsIgnoreCase("doctor");
        boolean fetchPharmacists = role == null || role.equalsIgnoreCase("pharmacist");

        if (fetchDoctors) {
            List<Medecin.StatutMedecin> doctorStatuts = List.of(Medecin.StatutMedecin.en_attente,
                    Medecin.StatutMedecin.PENDING);
            List<Medecin> pendingDoctors = medecinRepository.findByStatutIn(doctorStatuts);

            for (Medecin m : pendingDoctors) {
                com.medical.platform.dto.PendingRequestDTO dto = new com.medical.platform.dto.PendingRequestDTO();
                dto.setUserId(m.getId());
                dto.setFullName(m.getNom() + " " + m.getPrenom());
                dto.setEmail(m.getEmail());
                dto.setRole("DOCTOR");
                dto.setLicenseNumber(m.getNumeroOrdre());
                dto.setSpecialization(m.getSpecialite());
                dto.setSubmissionDate(m.getDateInscription());
                requests.add(dto);
            }
            log.info("Found {} pending doctors", pendingDoctors.size());
        }

        if (fetchPharmacists) {
            List<Pharmacien.StatutPharmacien> pharmaStatuts = List.of(Pharmacien.StatutPharmacien.en_attente,
                    Pharmacien.StatutPharmacien.PENDING);
            List<Pharmacien> pendingPharmacists = pharmacienRepository.findByStatutIn(pharmaStatuts);

            for (Pharmacien p : pendingPharmacists) {
                com.medical.platform.dto.PendingRequestDTO dto = new com.medical.platform.dto.PendingRequestDTO();
                dto.setUserId(p.getId());
                dto.setFullName(p.getNom() + " " + p.getPrenom());
                dto.setEmail(p.getEmail());
                dto.setRole("PHARMACIST");
                dto.setLicenseNumber(p.getNumeroOrdre());

                // fetch pharmacy name
                String pharmacyName = pharmacieRepository.findByPharmacienId(p.getId())
                        .map(Pharmacie::getNom)
                        .orElse("N/A");
                dto.setPharmacyName(pharmacyName);
                dto.setSubmissionDate(p.getDateInscription());
                requests.add(dto);
            }
            log.info("Found {} pending pharmacists", pendingPharmacists.size());
        }

        // Sort by submissionDate
        requests.sort(Comparator.comparing(com.medical.platform.dto.PendingRequestDTO::getSubmissionDate,
                Comparator.nullsLast(Comparator.naturalOrder())));

        return requests;
    }

    public void approveUser(Long userId) {
        boolean found = false;

        Medecin m = medecinRepository.findById(userId).orElse(null);
        if (m != null && (m.getStatut() == Medecin.StatutMedecin.en_attente
                || m.getStatut() == Medecin.StatutMedecin.PENDING)) {
            m.setStatut(Medecin.StatutMedecin.actif);
            m.setEnabled(true);
            medecinRepository.save(m);
            found = true;
            try {
                emailNotificationService.sendInscriptionAcceptee(m.getEmail(), m.getNom() + " " + m.getPrenom());
            } catch (Exception e) {
            }
        }

        Pharmacien p = pharmacienRepository.findById(userId).orElse(null);
        if (p != null && (p.getStatut() == Pharmacien.StatutPharmacien.en_attente
                || p.getStatut() == Pharmacien.StatutPharmacien.PENDING)) {
            p.setStatut(Pharmacien.StatutPharmacien.actif);
            p.setEnabled(true);
            pharmacienRepository.save(p);
            found = true;
            try {
                emailNotificationService.sendInscriptionAcceptee(p.getEmail(), p.getNom() + " " + p.getPrenom());
            } catch (Exception e) {
            }
        }

        if (!found) {
            throw new RuntimeException("Pending user practically not found or already processed");
        }
    }

    public void rejectUser(Long userId, String reason) {
        boolean found = false;

        Medecin m = medecinRepository.findById(userId).orElse(null);
        if (m != null && (m.getStatut() == Medecin.StatutMedecin.en_attente
                || m.getStatut() == Medecin.StatutMedecin.PENDING)) {
            m.setStatut(Medecin.StatutMedecin.rejete);
            m.setEnabled(false);
            m.setRejectionReason(reason);
            medecinRepository.save(m);
            found = true;
            try {
                emailNotificationService.sendInscriptionRejetee(m.getEmail(), m.getNom() + " " + m.getPrenom(), reason);
            } catch (Exception e) {
            }
        }

        Pharmacien p = pharmacienRepository.findById(userId).orElse(null);
        if (p != null && (p.getStatut() == Pharmacien.StatutPharmacien.en_attente
                || p.getStatut() == Pharmacien.StatutPharmacien.PENDING)) {
            p.setStatut(Pharmacien.StatutPharmacien.rejete);
            p.setEnabled(false);
            p.setRejectionReason(reason);
            pharmacienRepository.save(p);
            found = true;
            try {
                emailNotificationService.sendInscriptionRejetee(p.getEmail(), p.getNom() + " " + p.getPrenom(), reason);
            } catch (Exception e) {
            }
        }

        if (!found) {
            throw new RuntimeException("Pending user practically not found or already processed");
        }
    }
}
