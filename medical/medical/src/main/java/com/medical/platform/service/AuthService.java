package com.medical.platform.service;

import com.medical.platform.dto.AuthResponseDTO;
import com.medical.platform.dto.DoctorResponseDTO;
import com.medical.platform.dto.GoogleLoginRequestDTO;
import com.medical.platform.dto.PharmacistRegistrationRequest;
import com.medical.platform.dto.RegisterRequestDTO;
import com.medical.platform.dto.UserResponseDTO;
import com.medical.platform.entity.*;
import com.medical.platform.repository.*;
import com.medical.platform.security.JwtUtils;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final AdminRepository adminRepository;
    private final PatientRepository patientRepository;
    private final MedecinRepository medecinRepository;
    private final PharmacienRepository pharmacienRepository;
    private final PharmacieRepository pharmacieRepository;
    private final DemandesInscriptionRepository demandesInscriptionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final EmailService emailService;

    @Value("${google.client.id:YOUR_GOOGLE_CLIENT_ID_HERE}")
    private String googleClientId;

    // Simple in-memory storage for OTPs (Email -> Code)
    // In a real app, use Redis or a DB table with expiration
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    private final Map<String, String> resetTokenStorage = new ConcurrentHashMap<>();

    public AuthService(AdminRepository adminRepository, PatientRepository patientRepository,
            MedecinRepository medecinRepository, PharmacienRepository pharmacienRepository,
            PharmacieRepository pharmacieRepository,
            DemandesInscriptionRepository demandesInscriptionRepository,
            PasswordEncoder passwordEncoder,
            JwtUtils jwtUtils,
            EmailService emailService) {
        this.adminRepository = adminRepository;
        this.patientRepository = patientRepository;
        this.medecinRepository = medecinRepository;
        this.pharmacienRepository = pharmacienRepository;
        this.pharmacieRepository = pharmacieRepository;
        this.demandesInscriptionRepository = demandesInscriptionRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.emailService = emailService;
    }

    /**
     * Login: enforces role if provided, otherwise tries all sequential.
     * For Doctor/Pharmacist: accepts email OR matricule (numero ordre).
     */
    public AuthResponseDTO login(String identifier, String password, String role) {
        if (role != null)
            role = role.toUpperCase();

        UserResponseDTO userDTO = null;

        if (role == null || "ADMIN".equals(role)) {
            log.debug("Login attempt for ADMIN: {}", identifier);
            Admin admin = adminRepository.findByEmail(identifier).orElse(null);
            if (admin != null) {
                log.debug("Admin found. Checking password...");
                if (passwordEncoder.matches(password, admin.getMotDePasse())) {
                    userDTO = toDTO(admin.getId(), admin.getNom() + " " + admin.getPrenom(), admin.getEmail(),
                            admin.getTelephone(), null, "ADMIN", "actif", admin.getDateInscription(),
                            admin.getProfilePhoto());
                    log.info("ADMIN login successful: {}", identifier);
                } else {
                    log.warn("ADMIN login failed: password mismatch for {}", identifier);
                }
            } else {
                log.debug("ADMIN not found for: {}", identifier);
            }
            if (userDTO == null && "ADMIN".equals(role))
                throw new RuntimeException("Invalid admin credentials");
        }

        if (userDTO == null && (role == null || "PATIENT".equals(role))) {
            log.debug("Login attempt for PATIENT: {}", identifier);
            Patient patient = patientRepository.findByEmail(identifier).orElse(null);
            if (patient != null) {
                log.debug("Patient found. Checking password...");
                if (passwordEncoder.matches(password, patient.getMotDePasse())) {
                    if (!patient.isVerified()) {
                        log.warn("Patient login attempt failed: account not verified for {}", identifier);
                        throw new RuntimeException(
                                "Votre compte n'est pas encore vérifié. Veuillez vérifier votre email.");
                    }
                    userDTO = toDTO(patient.getId(), patient.getNom() + " " + patient.getPrenom(), patient.getEmail(),
                            patient.getTelephone(), patient.getAdresse(), "PATIENT", "actif",
                            patient.getDateInscription(),
                            patient.getProfilePhoto());
                    log.info("PATIENT login successful: {}", identifier);
                } else {
                    log.warn("PATIENT login failed: password mismatch for {}", identifier);
                }
            } else {
                log.debug("PATIENT not found for: {}", identifier);
            }
            if (userDTO == null && "PATIENT".equals(role))
                throw new RuntimeException("Invalid patient credentials");
        }

        if (userDTO == null && (role == null || "DOCTOR".equals(role) || "MEDECIN".equals(role))) {
            log.debug("Login attempt for DOCTOR: {}", identifier);
            Medecin medecin = medecinRepository.findByEmail(identifier)
                    .or(() -> medecinRepository.findByNumeroOrdre(identifier))
                    .orElse(null);
            if (medecin != null) {
                log.debug("Doctor found: {}. Checking password...", medecin.getEmail());
                if (passwordEncoder.matches(password, medecin.getMotDePasse())) {
                    if (medecin.getStatut() == Medecin.StatutMedecin.en_attente) {
                        log.warn("Doctor login failed: account pending approval for {}", medecin.getEmail());
                        throw new RuntimeException("Your account is pending admin approval.");
                    }
                    if (medecin.getStatut() == Medecin.StatutMedecin.rejete) {
                        log.warn("Doctor login failed: account rejected for {}", medecin.getEmail());
                        throw new RuntimeException("Your registration was rejected.");
                    }
                    userDTO = toDTO(medecin.getId(), medecin.getNom() + " " + medecin.getPrenom(), medecin.getEmail(),
                            medecin.getTelephone(), medecin.getAdresse(), "DOCTOR", medecin.getStatut().name(),
                            medecin.getDateInscription(), medecin.getProfilePhoto());
                    log.info("DOCTOR login successful: {}", medecin.getEmail());
                } else {
                    log.warn("DOCTOR login failed: password mismatch for {}", medecin.getEmail());
                }
            } else {
                log.debug("DOCTOR not found for identifier: {}", identifier);
            }
            if (userDTO == null && ("DOCTOR".equals(role) || "MEDECIN".equals(role)))
                throw new RuntimeException("Invalid doctor credentials");
        }

        if (userDTO == null && (role == null || "PHARMACIST".equals(role) || "PHARMACIEN".equals(role))) {
            log.debug("Login attempt for PHARMACIST: {}", identifier);
            Pharmacien pharmacien = pharmacienRepository.findByEmail(identifier)
                    .or(() -> pharmacienRepository.findByNumeroOrdre(identifier))
                    .orElse(null);
            if (pharmacien != null) {
                log.debug("Pharmacist found: {}. Checking password...", pharmacien.getEmail());
                if (passwordEncoder.matches(password, pharmacien.getMotDePasse())) {
                    if (pharmacien.getStatut() == Pharmacien.StatutPharmacien.en_attente) {
                        log.warn("Pharmacist login failed: account pending approval for {}", pharmacien.getEmail());
                        throw new RuntimeException("Your account is pending admin approval.");
                    }
                    if (pharmacien.getStatut() == Pharmacien.StatutPharmacien.rejete) {
                        log.warn("Pharmacist login failed: account rejected for {}", pharmacien.getEmail());
                        throw new RuntimeException("Your registration was rejected.");
                    }
                    userDTO = toDTO(pharmacien.getId(), pharmacien.getNom() + " " + pharmacien.getPrenom(),
                            pharmacien.getEmail(), pharmacien.getTelephone(), pharmacien.getAdresse(), "PHARMACIST",
                            pharmacien.getStatut().name(), pharmacien.getDateInscription(),
                            pharmacien.getProfilePhoto());
                    log.info("PHARMACIST login successful: {}", pharmacien.getEmail());
                } else {
                    log.warn("PHARMACIST login failed: password mismatch for {}", pharmacien.getEmail());
                }
            } else {
                log.debug("PHARMACIST not found for identifier: {}", identifier);
            }
            if (userDTO == null && ("PHARMACIST".equals(role) || "PHARMACIEN".equals(role)))
                throw new RuntimeException("Invalid pharmacist credentials");
        }

        if (userDTO == null) {
            throw new RuntimeException("Invalid email, matricule or password");
        }

        String token = jwtUtils.generateToken(userDTO.getEmail());
        AuthResponseDTO response = new AuthResponseDTO();
        response.setMessage("Login successful");
        response.setUser(userDTO);
        response.setToken(token);
        return response;
    }

    /**
     * Register: PATIENT → direct; DOCTOR/PHARMACIST → create + demande (admin
     * approval).
     */
    public UserResponseDTO register(RegisterRequestDTO request) {
        String role = request.getRole().toUpperCase();
        if ("ADMIN".equals(role))
            throw new RuntimeException("Admin accounts cannot be created via registration");

        if (patientRepository.existsByEmail(request.getEmail()) || adminRepository.existsByEmail(request.getEmail())
                || medecinRepository.existsByEmail(request.getEmail())
                || pharmacienRepository.existsByEmail(request.getEmail()))
            throw new RuntimeException("Email already exists: " + request.getEmail());

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        String nom = request.getName() != null ? request.getName().trim() : "";
        String prenom = nom.contains(" ") ? nom.substring(nom.indexOf(" ") + 1) : "";
        if (nom.contains(" "))
            nom = nom.substring(0, nom.indexOf(" "));
        if (nom.isEmpty())
            nom = request.getName();

        switch (role) {
            case "PATIENT": {
                Patient p = new Patient();
                p.setNom(nom);
                p.setPrenom(prenom.isEmpty() ? nom : prenom);
                p.setEmail(request.getEmail());
                p.setMotDePasse(encodedPassword);
                p.setTelephone(request.getPhone());
                p.setAdresse(request.getAddress());
                if (request.getDateOfBirth() != null)
                    p.setDateNaissance(java.time.LocalDate.parse(request.getDateOfBirth()));
                p.setGroupeSanguin(request.getBloodGroup());
                p.setAntecedents(request.getMedicalHistory());
                p.setVerified(false); // New patients must verify email
                p = patientRepository.save(p);

                // Send OTP for verification
                generateAndSendOTP(p.getEmail());

                return toDTO(p.getId(), p.getNom() + " " + p.getPrenom(), p.getEmail(), p.getTelephone(),
                        p.getAdresse(), "PATIENT", "en_attente_verification", p.getDateInscription(),
                        p.getProfilePhoto());
            }
            case "DOCTOR": {
                Medecin m = new Medecin();
                m.setNom(nom);
                m.setPrenom(prenom.isEmpty() ? nom : prenom);
                m.setEmail(request.getEmail());
                m.setMotDePasse(encodedPassword);
                m.setTelephone(request.getPhone());
                m.setAdresse(request.getAddress());
                m.setStatut(Medecin.StatutMedecin.en_attente);
                m.setSpecialite(request.getSpecialization());

                String license = request.getMatricule() != null ? request.getMatricule() : request.getLicenseNumber();
                m.setNumeroOrdre(license != null ? license : "ORDRE-" + System.currentTimeMillis());

                m = medecinRepository.save(m);
                DemandesInscription d = new DemandesInscription();
                d.setMedecin(m);
                d.setStatut(DemandesInscription.StatutDemande.en_attente);
                demandesInscriptionRepository.save(d);
                return toDTO(m.getId(), m.getNom() + " " + m.getPrenom(), m.getEmail(), m.getTelephone(),
                        m.getAdresse(), "DOCTOR", "en_attente", m.getDateInscription(), m.getProfilePhoto());
            }
            case "PHARMACIST": {
                Pharmacien ph = new Pharmacien();
                ph.setNom(nom);
                ph.setPrenom(prenom.isEmpty() ? nom : prenom);
                ph.setEmail(request.getEmail());
                ph.setMotDePasse(encodedPassword);
                ph.setTelephone(request.getPhone());
                ph.setAdresse(request.getAddress());
                ph.setStatut(Pharmacien.StatutPharmacien.en_attente);

                String phLicense = request.getMatricule() != null ? request.getMatricule() : request.getLicenseNumber();
                ph.setNumeroOrdre(phLicense != null ? phLicense : "ORDRE-" + System.currentTimeMillis());

                ph = pharmacienRepository.save(ph);

                // Create associated Pharmacy
                String phAddr = request.getPharmacyAddress();
                if (phAddr == null || phAddr.trim().isEmpty()) {
                    phAddr = "Adresse à préciser";
                }

                Pharmacie pharmacy = new Pharmacie();
                pharmacy.setPharmacien(ph);
                pharmacy.setNom(request.getPharmacyName() != null ? request.getPharmacyName() : "Pharmacie");
                pharmacy.setAdresse(phAddr); // adresse is NOT NULL - always set
                pharmacy.setTelephone(
                        request.getPharmacyPhone() != null ? request.getPharmacyPhone() : request.getPhone());
                // Cast Float → Double to match entity field type
                pharmacy.setLatitude(request.getLatitude() != null ? request.getLatitude().doubleValue() : null);
                pharmacy.setLongitude(request.getLongitude() != null ? request.getLongitude().doubleValue() : null);
                pharmacy.setOuvert24h(request.isOpen24Hours());
                pharmacieRepository.save(pharmacy);

                DemandesInscription d = new DemandesInscription();
                d.setPharmacien(ph);
                d.setStatut(DemandesInscription.StatutDemande.en_attente);
                demandesInscriptionRepository.save(d);
                return toDTO(ph.getId(), ph.getNom() + " " + ph.getPrenom(), ph.getEmail(), ph.getTelephone(),
                        ph.getAdresse(), "PHARMACIST", "en_attente", ph.getDateInscription(), ph.getProfilePhoto());
            }
            default:
                throw new RuntimeException("Invalid role. Must be PATIENT, DOCTOR, or PHARMACIST");
        }
    }

    /** Get user by email (searches admin, patient, medecin, pharmacien). */
    public UserResponseDTO getUserByEmail(String email) {
        Admin admin = adminRepository.findByEmail(email).orElse(null);
        if (admin != null)
            return toDTO(admin.getId(), admin.getNom() + " " + admin.getPrenom(), admin.getEmail(),
                    admin.getTelephone(), null, "ADMIN", "actif", admin.getDateInscription(), admin.getProfilePhoto());
        Patient patient = patientRepository.findByEmail(email).orElse(null);
        if (patient != null)
            return toDTO(patient.getId(), patient.getNom() + " " + patient.getPrenom(), patient.getEmail(),
                    patient.getTelephone(), patient.getAdresse(), "PATIENT", "actif", patient.getDateInscription(),
                    patient.getProfilePhoto());
        Medecin medecin = medecinRepository.findByEmail(email).orElse(null);
        if (medecin != null)
            return toDTO(medecin.getId(), medecin.getNom() + " " + medecin.getPrenom(), medecin.getEmail(),
                    medecin.getTelephone(), medecin.getAdresse(), "DOCTOR", medecin.getStatut().name(),
                    medecin.getDateInscription(), medecin.getProfilePhoto());
        Pharmacien pharmacien = pharmacienRepository.findByEmail(email).orElse(null);
        if (pharmacien != null)
            return toDTO(pharmacien.getId(), pharmacien.getNom() + " " + pharmacien.getPrenom(), pharmacien.getEmail(),
                    pharmacien.getTelephone(), pharmacien.getAdresse(), "PHARMACIST", pharmacien.getStatut().name(),
                    pharmacien.getDateInscription(), pharmacien.getProfilePhoto());
        throw new RuntimeException("User not found: " + email);
    }

    /**
     * Get user by id and optional role (ADMIN, PATIENT, DOCTOR, PHARMACIST). If
     * role null, try all.
     */
    public UserResponseDTO getUserById(Long id, String role) {
        if (role != null) {
            switch (role.toUpperCase()) {
                case "ADMIN":
                    return adminRepository.findById(id)
                            .map(a -> toDTO(a.getId(), a.getNom() + " " + a.getPrenom(), a.getEmail(), a.getTelephone(),
                                    null, "ADMIN", "actif", a.getDateInscription(), a.getProfilePhoto()))
                            .orElseThrow(() -> new RuntimeException("Admin not found: " + id));
                case "PATIENT":
                    return patientRepository.findById(id)
                            .map(p -> toDTO(p.getId(), p.getNom() + " " + p.getPrenom(), p.getEmail(), p.getTelephone(),
                                    p.getAdresse(), "PATIENT", "actif", p.getDateInscription(), p.getProfilePhoto()))
                            .orElseThrow(() -> new RuntimeException("Patient not found: " + id));
                case "DOCTOR":
                    return medecinRepository.findById(id)
                            .map(m -> toDTO(m.getId(), m.getNom() + " " + m.getPrenom(), m.getEmail(), m.getTelephone(),
                                    m.getAdresse(), "DOCTOR", m.getStatut().name(), m.getDateInscription(),
                                    m.getProfilePhoto()))
                            .orElseThrow(() -> new RuntimeException("Medecin not found: " + id));
                case "PHARMACIST":
                    return pharmacienRepository.findById(id)
                            .map(ph -> toDTO(ph.getId(), ph.getNom() + " " + ph.getPrenom(), ph.getEmail(),
                                    ph.getTelephone(), ph.getAdresse(), "PHARMACIST", ph.getStatut().name(),
                                    ph.getDateInscription(), ph.getProfilePhoto()))
                            .orElseThrow(() -> new RuntimeException("Pharmacien not found: " + id));
            }
        }
        if (adminRepository.findById(id).isPresent())
            return getUserById(id, "ADMIN");
        if (patientRepository.findById(id).isPresent())
            return getUserById(id, "PATIENT");
        if (medecinRepository.findById(id).isPresent())
            return getUserById(id, "DOCTOR");
        if (pharmacienRepository.findById(id).isPresent())
            return getUserById(id, "PHARMACIST");
        throw new RuntimeException("User not found with ID: " + id);
    }

    /** Generate and send OTP for Patient login */
    public void generateAndSendOTP(String email) {
        if (!patientRepository.existsByEmail(email)) {
            throw new RuntimeException("Patient with email " + email + " not found.");
        }

        String otp = String.format("%06d", new Random().nextInt(999999));
        otpStorage.put(email, otp);

        try {
            emailService.sendOTP(email, otp);
            System.out.println("OTP sent to " + email + ": " + otp);
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR: Failed to send email to " + email);
            System.err.println("OTP that SHOULD have been sent: " + otp);
            System.err.println("Error details: " + e.getMessage());
            // We don't throw exception here to allow user to see the code in console for
            // testing
        }

        System.out.println("\n--- IMPORTANT: Mediconnect Pro Verification Code ---");
        System.out.println("User: " + email);
        System.out.println("Code: " + otp);
        System.out.println("--------------------------------------------------\n");
    }

    /** Verify OTP and return session token */
    public AuthResponseDTO verifyOTPAndLogin(String email, String code) {
        String storedOtp = otpStorage.get(email);
        if (storedOtp == null || !storedOtp.equals(code)) {
            throw new RuntimeException("Invalid or expired verification code.");
        }

        otpStorage.remove(email); // One-time use

        Patient patient = patientRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        UserResponseDTO userDTO = toDTO(patient.getId(), patient.getNom() + " " + patient.getPrenom(),
                patient.getEmail(), patient.getTelephone(), patient.getAdresse(), "PATIENT", "actif",
                patient.getDateInscription(), patient.getProfilePhoto());

        String token = jwtUtils.generateToken(userDTO.getEmail());
        AuthResponseDTO response = new AuthResponseDTO();
        response.setUser(userDTO);
        response.setToken(token);
        response.setMessage("Connexion réussie");
        return response;
    }

    /** Verify registration code and create patient account */
    public AuthResponseDTO verifyRegistration(String email, String code) {
        // Deprecated by finalizeGoogleRegistration for new flow
        return verifyOTPAndLogin(email, code);
    }

    /** 1. Initiate Google Registration: Token -> OTP */
    public void initiateGoogleRegistration(String idTokenString) {
        GoogleIdToken.Payload payload = verifyGoogleIdToken(idTokenString);
        String email = payload.getEmail();

        if (patientRepository.existsByEmail(email)) {
            throw new RuntimeException("Cet email est déjà enregistré. Veuillez vous connecter.");
        }

        String otp = String.format("%06d", new Random().nextInt(999999));
        otpStorage.put(email, otp);

        try {
            emailService.sendOTP(email, otp);
            System.out.println("Registration OTP sent to " + email + ": " + otp);
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR: Failed to send Registration email to " + email);
            System.err.println("OTP that SHOULD have been sent: " + otp);
            System.err.println("Error details: " + e.getMessage());
        }
    }

    /** 2. Finalize Google Registration: Token + OTP -> User Creation */
    public AuthResponseDTO finalizeGoogleRegistration(String idTokenString, String code) {
        GoogleIdToken.Payload payload = verifyGoogleIdToken(idTokenString);
        String email = payload.getEmail();
        String name = (String) payload.get("name");

        String storedOtp = otpStorage.get(email);
        if (storedOtp == null || !storedOtp.equals(code)) {
            throw new RuntimeException("Code de vérification invalide ou expiré.");
        }

        otpStorage.remove(email);

        Patient patient = new Patient();
        patient.setEmail(email);
        String[] parts = name != null ? name.split(" ", 2) : new String[] { email, "" };
        patient.setNom(parts[0]);
        patient.setPrenom(parts.length > 1 ? parts[1] : parts[0]);
        patient.setMotDePasse(passwordEncoder.encode("GOOGLE_REGISTERED_" + System.currentTimeMillis()));
        patient.setVerified(true);
        patient = patientRepository.save(patient);

        UserResponseDTO userDTO = toDTO(patient.getId(), patient.getNom() + " " + patient.getPrenom(),
                patient.getEmail(), patient.getTelephone(), patient.getAdresse(), "PATIENT", "actif",
                patient.getDateInscription(), patient.getProfilePhoto());

        String token = jwtUtils.generateToken(userDTO.getEmail());
        AuthResponseDTO response = new AuthResponseDTO();
        response.setMessage("Compte créé avec succès !");
        response.setUser(userDTO);
        response.setToken(token);
        return response;
    }

    /** Strict Google Login: Token -> Existence Check */
    public AuthResponseDTO verifyGoogleTokenAndLogin(GoogleLoginRequestDTO request) {
        GoogleIdToken.Payload payload = verifyGoogleIdToken(request.getIdToken());
        String email = payload.getEmail();

        Patient patient = patientRepository.findByEmail(email).orElse(null);
        System.out.println("DEBUG: Strict Google login check for: " + email + " (Found: " + (patient != null) + ")");

        if (patient == null) {
            throw new RuntimeException("This email is not registered. Please create an account first.");
        }

        if (!patient.isVerified()) {
            generateAndSendOTP(email);
            throw new RuntimeException("Veuillez vérifier votre email. Un code a été envoyé.");
        }

        UserResponseDTO userDTO = toDTO(patient.getId(), patient.getNom() + " " + patient.getPrenom(),
                patient.getEmail(), patient.getTelephone(), patient.getAdresse(), "PATIENT", "actif",
                patient.getDateInscription(), patient.getProfilePhoto());

        String token = jwtUtils.generateToken(userDTO.getEmail());
        AuthResponseDTO response = new AuthResponseDTO();
        response.setMessage("Connexion Google réussie");
        response.setUser(userDTO);
        response.setToken(token);
        return response;
    }

    /** Helper to verify Google ID Token */
    private GoogleIdToken.Payload verifyGoogleIdToken(String idTokenString) {
        if (idTokenString == null || idTokenString.isEmpty()) {
            throw new RuntimeException("Google ID Token is missing");
        }
        try {
            System.out.println("DEBUG: Verifying Google Token with Client ID: [" + googleClientId + "]");
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(),
                    new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId.trim()))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                System.out.println("DEBUG: Verification FAILED - Token is null or invalid for this audience.");
                throw new RuntimeException("Invalid Google ID Token");
            }
            return idToken.getPayload();
        } catch (Exception e) {
            System.out.println("DEBUG: Verification ERROR: " + e.getMessage());
            throw new RuntimeException("Google token verification failed: " + e.getMessage());
        }
    }

    public List<DoctorResponseDTO> getActiveDoctors() {
        return medecinRepository.findByStatut(Medecin.StatutMedecin.actif).stream()
                .map(m -> new DoctorResponseDTO(
                        m.getId(), m.getNom() + " " + m.getPrenom(), m.getEmail(),
                        m.getTelephone(), m.getAdresse(), "DOCTOR", m.getStatut().name(),
                        true, m.getDateInscription(), m.getSpecialite(), m.getNumeroOrdre()))
                .collect(Collectors.toList());
    }

    public void initiatePasswordReset(String email) {
        // Check if user exists (any role)
        getUserByEmail(email); // Throws if not found

        String token = UUID.randomUUID().toString();
        resetTokenStorage.put(email, token);

        String resetLink = "http://localhost:4200/auth?mode=reset-password&token=" + token + "&email=" + email;
        String subject = "Mediconnect Pro - Réinitialisation de votre mot de passe";
        String body = "Bonjour,\n\n" +
                "Vous avez demandé la réinitialisation de votre mot de passe sur Mediconnect Pro.\n\n" +
                "Veuillez cliquer sur le lien ci-dessous pour définir un nouveau mot de passe :\n" +
                resetLink + "\n\n" +
                "Ce lien est valable pour une durée limitée.\n\n" +
                "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.\n\n" +
                "Cordialement,\n" +
                "L'équipe Mediconnect Pro";

        emailService.sendEmail(email, subject, body);
    }

    public void resetPassword(String email, String token, String newPassword) {
        String storedToken = resetTokenStorage.get(email);
        if (storedToken == null || !storedToken.equals(token)) {
            throw new RuntimeException("Lien de réinitialisation invalide ou expiré.");
        }

        String encodedPassword = passwordEncoder.encode(newPassword);

        // Update user in appropriate repository
        boolean updated = false;

        Admin admin = adminRepository.findByEmail(email).orElse(null);
        if (admin != null) {
            admin.setMotDePasse(encodedPassword);
            adminRepository.save(admin);
            updated = true;
        }

        if (!updated) {
            Patient patient = patientRepository.findByEmail(email).orElse(null);
            if (patient != null) {
                patient.setMotDePasse(encodedPassword);
                patientRepository.save(patient);
                updated = true;
            }
        }

        if (!updated) {
            Medecin medecin = medecinRepository.findByEmail(email).orElse(null);
            if (medecin != null) {
                medecin.setMotDePasse(encodedPassword);
                medecinRepository.save(medecin);
                updated = true;
            }
        }

        if (!updated) {
            Pharmacien pharmacien = pharmacienRepository.findByEmail(email).orElse(null);
            if (pharmacien != null) {
                pharmacien.setMotDePasse(encodedPassword);
                pharmacienRepository.save(pharmacien);
                updated = true;
            }
        }

        if (!updated)
            throw new RuntimeException("Utilisateur non trouvé pour la réinitialisation.");

        // Clear token
        resetTokenStorage.remove(email);
    }

    public Pharmacien registerPharmacist(PharmacistRegistrationRequest request) {
        // 1. Split 'name' into nom + prenom (frontend sends one combined field)
        String fullName = request.getName() != null ? request.getName().trim() : "Pharmacien";
        String[] parts = fullName.split(" ", 2);
        String prenom = parts[0];
        String nom = parts.length > 1 ? parts[1] : parts[0];

        // 2. Create pharmacist entity
        Pharmacien ph = new Pharmacien();
        ph.setPrenom(prenom);
        ph.setNom(nom);
        ph.setEmail(request.getEmail());
        ph.setMotDePasse(passwordEncoder.encode(request.getPassword()));
        ph.setTelephone(request.getPhone());

        // Personal address of the pharmacist (fallback to pharmacy address if not
        // provided)
        String personalAddress = request.getAddress();
        if (personalAddress == null || personalAddress.trim().isEmpty()) {
            personalAddress = request.getPharmacyAddress() != null ? request.getPharmacyAddress()
                    : "Adresse non spécifiée";
        }
        ph.setAdresse(personalAddress);

        // Use matricule from frontend; auto-generate if not provided
        String matricule = request.getMatricule();
        ph.setNumeroOrdre(matricule != null && !matricule.trim().isEmpty()
                ? matricule
                : "ORDRE-" + System.currentTimeMillis());
        ph.setStatut(Pharmacien.StatutPharmacien.en_attente);

        ph = pharmacienRepository.save(ph);

        // 2. Create pharmacy - SET ALL FIELDS including adresse (NOT NULL in DB)
        String pharmacyAddr = request.getPharmacyAddress();
        if (pharmacyAddr == null || pharmacyAddr.trim().isEmpty()) {
            pharmacyAddr = "Adresse à préciser";
        }

        Pharmacie pharmacy = new Pharmacie();
        pharmacy.setPharmacien(ph);
        pharmacy.setNom(request.getPharmacyName() != null ? request.getPharmacyName() : "Pharmacie");
        pharmacy.setAdresse(pharmacyAddr);
        pharmacy.setTelephone(request.getPharmacyPhone() != null ? request.getPharmacyPhone() : request.getPhone());
        pharmacy.setLatitude(request.getLatitude());
        pharmacy.setLongitude(request.getLongitude());
        pharmacy.setOuvert24h(request.isOpen24Hours());

        // Explicit pre-save validation — gives a clear error instead of a cryptic SQL
        // exception
        log.debug("Saving pharmacy: nom='{}', adresse='{}', telephone='{}'",
                pharmacy.getNom(), pharmacy.getAdresse(), pharmacy.getTelephone());
        if (pharmacy.getAdresse() == null || pharmacy.getAdresse().trim().isEmpty()) {
            throw new RuntimeException("pharmacyAddress is required and cannot be null or empty");
        }

        pharmacieRepository.save(pharmacy);

        // 3. Create registration request for admin approval
        DemandesInscription d = new DemandesInscription();
        d.setPharmacien(ph);
        d.setStatut(DemandesInscription.StatutDemande.en_attente);
        demandesInscriptionRepository.save(d);

        return ph;
    }

    private UserResponseDTO toDTO(Long id, String name, String email, String phone, String address, String role,
            String statut, java.time.LocalDateTime createdAt, String profilePhoto) {
        UserResponseDTO dto = new UserResponseDTO();
        dto.setId(id);
        dto.setName(name);
        dto.setEmail(email);
        dto.setPhone(phone);
        dto.setAddress(address);
        dto.setRole(role);
        dto.setStatut(statut);
        dto.setEnabled(true);
        dto.setCreatedAt(createdAt);
        if (profilePhoto != null && profilePhoto.startsWith("data:")) {
            profilePhoto = null; // Filter out legacy Base64
        }
        dto.setProfilePhoto(profilePhoto);
        return dto;
    }
}
