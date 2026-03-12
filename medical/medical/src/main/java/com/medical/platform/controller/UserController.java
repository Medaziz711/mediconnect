package com.medical.platform.controller;

import com.medical.platform.dto.AuthResponseDTO;
import com.medical.platform.dto.DoctorResponseDTO;
import com.medical.platform.dto.GoogleLoginRequestDTO;
import com.medical.platform.dto.LoginRequestDTO;
import com.medical.platform.dto.PasswordResetRequestDTO;
import com.medical.platform.dto.PharmacistRegistrationRequest;
import com.medical.platform.dto.RegisterRequestDTO;
import com.medical.platform.dto.UserResponseDTO;
import com.medical.platform.entity.Pharmacien;
import com.medical.platform.service.AuthService;
import com.medical.platform.security.JwtUtils;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.validation.BindingResult;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AuthService authService;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    public UserController(AuthService authService, AuthenticationManager authenticationManager, JwtUtils jwtUtils) {
        this.authService = authService;
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/auth/register/pharmacist")
    public ResponseEntity<?> registerPharmacist(@Valid @RequestBody PharmacistRegistrationRequest request,
            BindingResult bindingResult) {
        // Log every received field for debugging
        log.info("=== RECEIVED PHARMACIST REGISTRATION ===");
        log.info("name: {}", request.getName());
        log.info("email: {}", request.getEmail());
        log.info("password: {}", request.getPassword() != null ? "provided" : "null");
        log.info("phone: {}", request.getPhone());
        log.info("address: {}", request.getAddress()); // Pharmacist's personal address
        log.info("matricule: {}", request.getMatricule());
        log.info("pharmacyName: {}", request.getPharmacyName());
        log.info("pharmacyAddress: {}", request.getPharmacyAddress());

        System.out.println("=== DEBUG PHARMACIST REGISTRATION ===");
        System.out.println("pharmacyName: '" + request.getPharmacyName() + "'");
        System.out.println("pharmacyAddress: '" + request.getPharmacyAddress() + "'");
        System.out.println("pharmacyAddress is null? " + (request.getPharmacyAddress() == null));
        System.out.println("pharmacyAddress is empty? "
                + (request.getPharmacyAddress() != null && request.getPharmacyAddress().isEmpty()));
        System.out.println("address: '" + request.getAddress() + "'");

        log.info("latitude: {}", request.getLatitude());
        log.info("longitude: {}", request.getLongitude());
        log.info("open24Hours: {}", request.isOpen24Hours());
        log.info("pharmacyPhone: {}", request.getPharmacyPhone());

        // Return detailed validation errors (shows WHICH fields failed)
        if (bindingResult.hasErrors()) {
            Map<String, String> fieldErrors = new HashMap<>();
            bindingResult.getFieldErrors().forEach(err -> fieldErrors.put(err.getField(), err.getDefaultMessage()));
            log.error("Validation errors: {}", fieldErrors);
            return ResponseEntity.badRequest().body(Map.of(
                    "message", "Validation failed",
                    "errors", fieldErrors));
        }

        try {
            // Safety check: address must never be null (DB constraint)
            if (request.getPharmacyAddress() == null || request.getPharmacyAddress().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Pharmacy address is required"));
            }

            Pharmacien ph = authService.registerPharmacist(request);
            log.info("SUCCESS: Pharmacist {} registered.", ph.getEmail());

            return ResponseEntity.ok(Map.of(
                    "message", "Pharmacist registered successfully. Pending approval.",
                    "userId", ph.getId()));
        } catch (Exception e) {
            log.error("REGISTRATION ERROR: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequestDTO request) {
        // Role-based custom validation
        if ("PHARMACIST".equalsIgnoreCase(request.getRole())) {
            if (request.getPharmacyName() == null || request.getPharmacyName().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Error: Pharmacy name is required for pharmacists");
            }
            if (request.getPharmacyAddress() == null || request.getPharmacyAddress().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Error: Pharmacy address is required for pharmacists");
            }
        }

        try {
            UserResponseDTO user = authService.register(request);
            AuthResponseDTO response = new AuthResponseDTO();
            response.setMessage("User registered successfully");
            response.setUser(user);
            response.setToken(null);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDTO request) {
        log.info("=== LOGIN ATTEMPT ===");
        log.info("Email: {}", request.getEmail());
        log.info("Password provided: {}", request.getPassword() != null ? "YES" : "NO");

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

            log.info("✅ Authentication successful");

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateToken(authentication.getName());

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            // Compatibility with existing AuthResponseDTO/UserResponseDTO if possible
            // but the user asked for this specific Map response for debugging
            return ResponseEntity.ok(Map.of(
                    "token", jwt,
                    "email", userDetails.getUsername(),
                    "role", userDetails.getAuthorities().iterator().next().getAuthority()));

        } catch (BadCredentialsException e) {
            log.error("❌ Bad credentials for email: {}", request.getEmail());
            return ResponseEntity.status(401).body(Map.of("message", "Invalid email or password"));
        } catch (UsernameNotFoundException e) {
            log.error("❌ User not found: {}", request.getEmail());
            return ResponseEntity.status(404).body(Map.of("message", "User not found"));
        } catch (Exception e) {
            log.error("❌ Unexpected error during login: ", e);
            return ResponseEntity.status(500).body(Map.of(
                    "message", e.getMessage() != null ? e.getMessage() : "Unknown error",
                    "cause", e.getCause() != null ? e.getCause().getMessage() : "No cause provided"));
        }
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOTP(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            authService.generateAndSendOTP(email);
            return ResponseEntity.ok(Map.of("message", "Verification code sent to " + email));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOTP(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String code = request.get("code");
            AuthResponseDTO response = authService.verifyOTPAndLogin(email, code);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/verify-registration")
    public ResponseEntity<?> verifyRegistration(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String code = request.get("code");
            AuthResponseDTO response = authService.verifyRegistration(email, code);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/login/google")
    public ResponseEntity<?> loginWithGoogle(@RequestBody GoogleLoginRequestDTO request) {
        try {
            AuthResponseDTO response = authService.verifyGoogleTokenAndLogin(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/google/register-init")
    public ResponseEntity<?> initiateGoogleRegistration(@RequestBody Map<String, String> request) {
        try {
            authService.initiateGoogleRegistration(request.get("idToken"));
            return ResponseEntity.ok(Map.of("message", "Registration OTP sent"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/google/register-finalize")
    public ResponseEntity<?> finalizeGoogleRegistration(@RequestBody Map<String, String> request) {
        try {
            AuthResponseDTO response = authService.finalizeGoogleRegistration(request.get("idToken"),
                    request.get("code"));
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<?> getUserByEmail(@PathVariable String email) {
        try {
            UserResponseDTO user = authService.getUserByEmail(email);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/list/doctors")
    public ResponseEntity<List<DoctorResponseDTO>> getDoctors() {
        return ResponseEntity.ok(authService.getActiveDoctors());
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            authService.initiatePasswordReset(request.get("email"));
            return ResponseEntity.ok(Map.of("message", "Reset link sent to " + request.get("email")));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody PasswordResetRequestDTO request) {
        try {
            authService.resetPassword(request.getEmail(), request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable String id, @RequestParam(required = false) String role) {
        try {
            UserResponseDTO user = authService.getUserById(Long.parseLong(id), role);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}
