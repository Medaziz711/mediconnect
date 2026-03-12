package com.medical.platform.controller;

import com.medical.platform.dto.DoctorResponseDTO;
import com.medical.platform.dto.DoctorUpdateDTO;

import com.medical.platform.entity.Medecin;
import com.medical.platform.repository.MedecinRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final MedecinRepository medecinRepository;
    private final PasswordEncoder passwordEncoder;
    private final com.medical.platform.service.FileStorageService fileStorageService;

    public DoctorController(MedecinRepository medecinRepository, PasswordEncoder passwordEncoder,
            com.medical.platform.service.FileStorageService fileStorageService) {
        this.medecinRepository = medecinRepository;
        this.passwordEncoder = passwordEncoder;
        this.fileStorageService = fileStorageService;
    }

    private DoctorResponseDTO mapToDTO(Medecin m) {
        DoctorResponseDTO dto = new DoctorResponseDTO(
                m.getId(),
                m.getNom() + " " + m.getPrenom(),
                m.getEmail(),
                m.getTelephone(),
                m.getAdresse(),
                "DOCTOR",
                m.getStatut().name(),
                true,
                m.getDateInscription(),
                m.getSpecialite(),
                m.getNumeroOrdre());
        dto.setFirstName(m.getPrenom());
        dto.setLastName(m.getNom());
        dto.setGender(m.getSexe());
        if (m.getDateNaissance() != null) {
            dto.setDateOfBirth(m.getDateNaissance().toString());
        }
        dto.setBloodGroup(m.getGroupeSanguin());
        dto.setExperienceYears(m.getAnneesExperience());
        dto.setConsultationFee(m.getTarifConsultation());
        dto.setLanguagesSpoken(m.getLanguesParlees());
        String photo = m.getProfilePhoto();
        if (photo != null && photo.startsWith("data:")) {
            photo = null; // Don't send Base64 back to frontend
        }
        dto.setProfilePhoto(photo);
        return dto;
    }

    @GetMapping
    public ResponseEntity<List<DoctorResponseDTO>> getDoctors() {
        List<Medecin> activeDoctors = medecinRepository.findByStatut(Medecin.StatutMedecin.actif);
        List<DoctorResponseDTO> response = activeDoctors.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DoctorResponseDTO> getDoctorById(@PathVariable Long id) {
        return medecinRepository.findById(id)
                .map(m -> ResponseEntity.ok(mapToDTO(m)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/profile/{id}")
    public ResponseEntity<?> updateDoctorProfile(@PathVariable Long id, @RequestBody DoctorUpdateDTO request) {
        return medecinRepository.findById(id).map(m -> {
            if (request.getFirstName() != null)
                m.setPrenom(request.getFirstName());
            if (request.getLastName() != null)
                m.setNom(request.getLastName());
            if (request.getEmail() != null)
                m.setEmail(request.getEmail());
            if (request.getPhone() != null)
                m.setTelephone(request.getPhone());
            if (request.getAddress() != null)
                m.setAdresse(request.getAddress());
            if (request.getGender() != null)
                m.setSexe(request.getGender());
            if (request.getDateOfBirth() != null && !request.getDateOfBirth().isEmpty()) {
                m.setDateNaissance(java.time.LocalDate.parse(request.getDateOfBirth()));
            }
            if (request.getBloodGroup() != null)
                m.setGroupeSanguin(request.getBloodGroup());
            if (request.getSpecialization() != null)
                m.setSpecialite(request.getSpecialization());
            if (request.getLicenseNumber() != null)
                m.setNumeroOrdre(request.getLicenseNumber());
            if (request.getExperienceYears() != null)
                m.setAnneesExperience(request.getExperienceYears());
            if (request.getConsultationFee() != null)
                m.setTarifConsultation(request.getConsultationFee());
            if (request.getLanguagesSpoken() != null)
                m.setLanguesParlees(request.getLanguagesSpoken());
            if (request.getProfilePhoto() != null && !request.getProfilePhoto().startsWith("data:"))
                m.setProfilePhoto(request.getProfilePhoto());

            if (request.getNewPassword() != null && !request.getNewPassword().isEmpty()) {
                m.setMotDePasse(passwordEncoder.encode(request.getNewPassword()));
            }

            medecinRepository.save(m);
            return ResponseEntity.ok(mapToDTO(m));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/photo")
    public ResponseEntity<?> uploadDoctorPhoto(@PathVariable Long id,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        System.out.println("========== DOCTOR_CONTROLLER DEBUG ==========");
        System.out.println("1. Method called for ID: " + id);
        System.out.println("2. File is null? " + (file == null));
        if (file != null) {
            System.out.println("3. File name: " + file.getOriginalFilename());
            System.out.println("4. File size: " + file.getSize());
            System.out.println("5. Content type: " + file.getContentType());
        }
        return medecinRepository.findById(id).map(m -> {
            try {
                String fileName = fileStorageService.storeFile(file, "doctor-" + id);

                // Cleanup old file if exists
                if (m.getProfilePhoto() != null && !m.getProfilePhoto().startsWith("data:")) {
                    fileStorageService.deleteFile(m.getProfilePhoto());
                }

                m.setProfilePhoto(fileName);
                medecinRepository.save(m);

                return ResponseEntity.ok(java.util.Map.of(
                        "photoUrl", "/api/profiles/photo/" + fileName,
                        "message", "Photo uploaded successfully"));
            } catch (Exception e) {
                e.printStackTrace();
                return ResponseEntity.internalServerError().body("Error uploading photo: " + e.getMessage());
            }
        }).orElse(ResponseEntity.notFound().build());
    }
}
