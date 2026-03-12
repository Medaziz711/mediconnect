package com.medical.platform.security;

import com.medical.platform.entity.Admin;
import com.medical.platform.entity.Medecin;
import com.medical.platform.entity.Patient;
import com.medical.platform.entity.Pharmacien;
import com.medical.platform.repository.AdminRepository;
import com.medical.platform.repository.MedecinRepository;
import com.medical.platform.repository.PatientRepository;
import com.medical.platform.repository.PharmacienRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private static final Logger log = LoggerFactory.getLogger(CustomUserDetailsService.class);

    private final AdminRepository adminRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final PharmacienRepository pharmacienRepository;

    public CustomUserDetailsService(AdminRepository adminRepository,
            PatientRepository patientRepository,
            MedecinRepository medecinRepository,
            PharmacienRepository pharmacienRepository) {
        this.adminRepository = adminRepository;
        this.patientRepository = patientRepository;
        this.medecinRepository = medecinRepository;
        this.pharmacienRepository = pharmacienRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        log.info("=== LOAD USER BY USERNAME ===");
        log.info("Searching for email: {}", email);

        // Search in pharmaciens table first (requested priority for debugging)
        Optional<Pharmacien> pharmacien = pharmacienRepository.findByEmail(email);
        if (pharmacien.isPresent()) {
            log.info("✅ Pharmacist found in database");
            Pharmacien p = pharmacien.get();
            return new CustomUserDetails(p.getId(), p.getEmail(), p.getMotDePasse(),
                    List.of(new SimpleGrantedAuthority("ROLE_PHARMACIST")));
        }

        Admin admin = adminRepository.findByEmail(email).orElse(null);
        if (admin != null) {
            log.info("✅ Admin found in database");
            return new CustomUserDetails(admin.getId(), admin.getEmail(), admin.getMotDePasse(),
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN")));
        }

        Patient patient = patientRepository.findByEmail(email).orElse(null);
        if (patient != null) {
            log.info("✅ Patient found in database");
            return new CustomUserDetails(patient.getId(), patient.getEmail(), patient.getMotDePasse(),
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_PATIENT")));
        }

        Medecin medecin = medecinRepository.findByEmail(email).orElse(null);
        if (medecin != null) {
            log.info("✅ Doctor found in database");
            return new CustomUserDetails(medecin.getId(), medecin.getEmail(), medecin.getMotDePasse(),
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_DOCTOR")));
        }

        log.error("❌ No user found with email: {}", email);
        throw new EmailNotFoundException("User not found with email: " + email);
    }
}
