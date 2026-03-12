package com.medical.platform.config;

import com.medical.platform.entity.Admin;
import com.medical.platform.entity.Patient;
import com.medical.platform.entity.Medecin;
import com.medical.platform.entity.Pharmacien;
import com.medical.platform.repository.AdminRepository;
import com.medical.platform.repository.PatientRepository;
import com.medical.platform.repository.MedecinRepository;
import com.medical.platform.repository.PharmacienRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
public class DataInitializer {

    @Bean
    public CommandLineRunner initData(
            AdminRepository adminRepository,
            PatientRepository patientRepository,
            MedecinRepository medecinRepository,
            PharmacienRepository pharmacienRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. Initialize Admin
            if (adminRepository.count() == 0) {
                Admin admin = new Admin();
                admin.setNom("Admin");
                admin.setPrenom("Système");
                admin.setEmail("admin@medical.com");
                admin.setMotDePasse(passwordEncoder.encode("admin123"));
                admin.setTelephone("0123456789");
                admin.setDateInscription(LocalDateTime.now());
                adminRepository.save(admin);
                System.out.println("Default Admin created: admin@medical.com / admin123");
            }

            // 2. Initialize Patient
            if (patientRepository.count() == 0) {
                Patient patient = new Patient();
                patient.setNom("Doe");
                patient.setPrenom("John");
                patient.setEmail("patient@medical.com");
                patient.setMotDePasse(passwordEncoder.encode("patient123"));
                patient.setTelephone("0987654321");
                patient.setDateInscription(LocalDateTime.now());
                patientRepository.save(patient);
                System.out.println("Default Patient created: patient@medical.com / patient123");
            }

            // 3. Initialize Doctor
            if (medecinRepository.count() == 0) {
                Medecin doctor = new Medecin();
                doctor.setNom("Smith");
                doctor.setPrenom("Jana");
                doctor.setEmail("doctor@medical.com");
                doctor.setMotDePasse(passwordEncoder.encode("doctor123"));
                doctor.setNumeroOrdre("DOC-12345");
                doctor.setStatut(Medecin.StatutMedecin.actif);
                doctor.setSpecialite("Généraliste");
                doctor.setDateInscription(LocalDateTime.now());
                medecinRepository.save(doctor);
                System.out.println("Default Doctor created: doctor@medical.com / doctor123");
            }
            
            // 4. Initialize Pharmacist
            if (pharmacienRepository.count() == 0) {
                Pharmacien pharmacist = new Pharmacien();
                pharmacist.setNom("Dupont");
                pharmacist.setPrenom("Marie");
                pharmacist.setEmail("pharmacist@medical.com");
                pharmacist.setMotDePasse(passwordEncoder.encode("pharmacist123"));
                pharmacist.setNumeroOrdre("PH-67890");
                pharmacist.setStatut(Pharmacien.StatutPharmacien.actif);
                pharmacist.setDateInscription(LocalDateTime.now());
                pharmacienRepository.save(pharmacist);
                System.out.println("Default Pharmacist created: pharmacist@medical.com / pharmacist123");
            }
        };
    }
}
