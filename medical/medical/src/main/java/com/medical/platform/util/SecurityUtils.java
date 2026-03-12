package com.medical.platform.util;

import com.medical.platform.dto.CurrentUserDTO;
import com.medical.platform.entity.Admin;
import com.medical.platform.entity.Medecin;
import com.medical.platform.entity.Patient;
import com.medical.platform.entity.Pharmacien;
import com.medical.platform.repository.AdminRepository;
import com.medical.platform.repository.MedecinRepository;
import com.medical.platform.repository.PatientRepository;
import com.medical.platform.repository.PharmacienRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityUtils {

    private final AdminRepository adminRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final PharmacienRepository pharmacienRepository;

    public SecurityUtils(AdminRepository adminRepository, PatientRepository patientRepository,
                         MedecinRepository medecinRepository, PharmacienRepository pharmacienRepository) {
        this.adminRepository = adminRepository;
        this.patientRepository = patientRepository;
        this.medecinRepository = medecinRepository;
        this.pharmacienRepository = pharmacienRepository;
    }

    public CurrentUserDTO getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null
                || "anonymousUser".equals(authentication.getName())) {
            throw new RuntimeException("Not authenticated. Please log in.");
        }
        String email = authentication.getName();
        Admin admin = adminRepository.findByEmail(email).orElse(null);
        if (admin != null) return new CurrentUserDTO(admin.getId(), admin.getEmail(), "ADMIN");
        Patient patient = patientRepository.findByEmail(email).orElse(null);
        if (patient != null) return new CurrentUserDTO(patient.getId(), patient.getEmail(), "PATIENT");
        Medecin medecin = medecinRepository.findByEmail(email).orElse(null);
        if (medecin != null) return new CurrentUserDTO(medecin.getId(), medecin.getEmail(), "DOCTOR");
        Pharmacien pharmacien = pharmacienRepository.findByEmail(email).orElse(null);
        if (pharmacien != null) return new CurrentUserDTO(pharmacien.getId(), pharmacien.getEmail(), "PHARMACIST");
        throw new RuntimeException("User not found: " + email);
    }

    public boolean hasRole(String role) {
        try {
            return role.equals(getCurrentUser().getRole());
        } catch (Exception e) {
            return false;
        }
    }
}
