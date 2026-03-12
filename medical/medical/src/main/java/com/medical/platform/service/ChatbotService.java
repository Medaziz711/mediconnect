package com.medical.platform.service;

import com.medical.platform.dto.ChatbotRequestDTO;
import com.medical.platform.dto.ChatbotResponseDTO;
import com.medical.platform.dto.CurrentUserDTO;
import com.medical.platform.dto.PharmacyInfoDTO;
import com.medical.platform.entity.*;
import com.medical.platform.repository.*;
import com.medical.platform.util.DistanceCalculator;
import com.medical.platform.util.SecurityUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ChatbotService {

    private final MedicamentRepository medicamentRepository;
    private final StockMedicamentRepository stockMedicamentRepository;
    private final DistanceCalculator distanceCalculator;
    private final MedicineRequestNotificationRepository notificationRepository;
    private final RendezVousRepository rendezVousRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final SecurityUtils securityUtils;

    public ChatbotService(MedicamentRepository medicamentRepository,
                          StockMedicamentRepository stockMedicamentRepository,
                          DistanceCalculator distanceCalculator,
                          MedicineRequestNotificationRepository notificationRepository,
                          RendezVousRepository rendezVousRepository,
                          PatientRepository patientRepository,
                          MedecinRepository medecinRepository,
                          SecurityUtils securityUtils) {
        this.medicamentRepository = medicamentRepository;
        this.stockMedicamentRepository = stockMedicamentRepository;
        this.distanceCalculator = distanceCalculator;
        this.notificationRepository = notificationRepository;
        this.rendezVousRepository = rendezVousRepository;
        this.patientRepository = patientRepository;
        this.medecinRepository = medecinRepository;
        this.securityUtils = securityUtils;
    }

    public ChatbotResponseDTO checkMedicineAvailability(ChatbotRequestDTO request) {
        String medicineName = request.getMedicine().trim();
        Double userLatitude = request.getUserLatitude();
        Double userLongitude = request.getUserLongitude();

        Medicament medicine = findMedicine(medicineName);
        if (medicine == null) {
            notifyDoctorForMissingMedicine(medicineName);
            return createNotAvailableResponse("Medicine not found: " + medicineName + ". Your doctor has been notified.");
        }

        List<StockMedicament> availableStock = stockMedicamentRepository
                .findAvailableNonExpiredStockByMedicamentId(medicine.getId(), LocalDate.now());
        if (availableStock.isEmpty()) {
            notifyDoctorForUnavailableMedicine(medicineName, medicine);
            List<String> alternatives = findAlternatives(medicine);
            return createNotAvailableResponse(
                    "Medicine not available in any pharmacy. We've checked all pharmacies. Your doctor has been notified.",
                    alternatives
            );
        }

        List<PharmacyInfoDTO> pharmacyInfoList = availableStock.stream()
                .map(stock -> {
                    Pharmacie pharmacie = stock.getPharmacie();
                    double distance = distanceCalculator.calculateDistanceRounded(
                            userLatitude, userLongitude,
                            pharmacie.getLatitude() != null ? pharmacie.getLatitude().doubleValue() : 0,
                            pharmacie.getLongitude() != null ? pharmacie.getLongitude().doubleValue() : 0
                    );
                    return new PharmacyInfoDTO(
                            pharmacie.getNom() != null ? pharmacie.getNom() : "Pharmacy",
                            pharmacie.getAdresse() != null ? pharmacie.getAdresse() : "",
                            distance,
                            stock.getQuantiteDisponible() != null ? stock.getQuantiteDisponible() : 0
                    );
                })
                .sorted(Comparator.comparing(PharmacyInfoDTO::getDistanceKm))
                .collect(Collectors.toList());

        PharmacyInfoDTO nearestPharmacy = pharmacyInfoList.get(0);
        List<PharmacyInfoDTO> otherPharmacies = pharmacyInfoList.size() > 1 ? pharmacyInfoList.subList(1, pharmacyInfoList.size()) : new ArrayList<>();
        ChatbotResponseDTO response = new ChatbotResponseDTO();
        response.setAvailable(true);
        response.setNearestPharmacy(nearestPharmacy);
        response.setOtherPharmacies(otherPharmacies);
        return response;
    }

    private Medicament findMedicine(String medicineName) {
        Optional<Medicament> exact = medicamentRepository.findByNom(medicineName);
        if (exact.isPresent()) return exact.get();
        List<Medicament> matches = medicamentRepository.findByNomContainingIgnoreCase(medicineName);
        return matches.isEmpty() ? null : matches.get(0);
    }

    private List<String> findAlternatives(Medicament medicine) {
        if (medicine.getDci() == null || medicine.getDci().trim().isEmpty()) return new ArrayList<>();
        List<Medicament> alternatives = medicamentRepository.findByDciIgnoreCase(medicine.getDci());
        return alternatives.stream()
                .filter(m -> !m.getId().equals(medicine.getId()))
                .map(Medicament::getNom)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private ChatbotResponseDTO createNotAvailableResponse(String message) {
        return createNotAvailableResponse(message, new ArrayList<>());
    }

    private ChatbotResponseDTO createNotAvailableResponse(String message, List<String> alternatives) {
        ChatbotResponseDTO response = new ChatbotResponseDTO();
        response.setAvailable(false);
        response.setMessage(message);
        response.setAlternatives(alternatives);
        response.setNearestPharmacy(null);
        response.setOtherPharmacies(new ArrayList<>());
        return response;
    }

    private void notifyDoctorForMissingMedicine(String medicineName) {
        try {
            CurrentUserDTO currentUser = securityUtils.getCurrentUser();
            if (!"PATIENT".equals(currentUser.getRole())) return;
            Patient patient = patientRepository.findById(currentUser.getId()).orElse(null);
            Medecin doctor = findPatientDoctor(currentUser.getId());
            if (patient != null && doctor != null) {
                MedicineRequestNotification n = new MedicineRequestNotification();
                n.setMedicineName(medicineName);
                n.setPatient(patient);
                n.setMedecin(doctor);
                n.setMessage("Patient " + patient.getNom() + " " + patient.getPrenom() + " requested medicine '" + medicineName + "' which is not in our database.");
                n.setRead(false);
                notificationRepository.save(n);
            }
        } catch (Exception e) {
            System.err.println("Error notifying doctor: " + e.getMessage());
        }
    }

    private void notifyDoctorForUnavailableMedicine(String medicineName, Medicament medicine) {
        try {
            CurrentUserDTO currentUser = securityUtils.getCurrentUser();
            if (!"PATIENT".equals(currentUser.getRole())) return;
            Patient patient = patientRepository.findById(currentUser.getId()).orElse(null);
            Medecin doctor = findPatientDoctor(currentUser.getId());
            if (patient != null && doctor != null) {
                MedicineRequestNotification n = new MedicineRequestNotification();
                n.setMedicineName(medicineName);
                n.setPatient(patient);
                n.setMedecin(doctor);
                n.setMessage("Patient " + patient.getNom() + " " + patient.getPrenom() + " requested medicine '" + medicineName + "' which is not available in any pharmacy. All pharmacies checked.");
                n.setRead(false);
                notificationRepository.save(n);
            }
        } catch (Exception e) {
            System.err.println("Error notifying doctor: " + e.getMessage());
        }
    }

    private Medecin findPatientDoctor(Long patientId) {
        try {
            List<RendezVous> rvs = rendezVousRepository.findByPatientIdOrderByDateHeureDesc(patientId);
            if (!rvs.isEmpty()) return rvs.get(0).getMedecin();
            return null;
        } catch (Exception e) {
            return null;
        }
    }
}
