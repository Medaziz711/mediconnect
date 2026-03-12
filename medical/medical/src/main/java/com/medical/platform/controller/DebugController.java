package com.medical.platform.controller;

import com.medical.platform.entity.Pharmacien;
import com.medical.platform.repository.PharmacienRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @Autowired
    private PharmacienRepository pharmacienRepository;

    @GetMapping("/check-pharmacist")
    public ResponseEntity<?> checkPharmacist(@RequestParam String email) {
        try {
            Optional<Pharmacien> result = pharmacienRepository.findByEmail(email);

            if (result.isPresent()) {
                Pharmacien p = result.get();
                return ResponseEntity.ok(Map.of(
                        "found", true,
                        "email", p.getEmail(),
                        "passwordHash", p.getMotDePasse(),
                        "status", p.getStatut()));
            } else {
                return ResponseEntity.ok(Map.of("found", false));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "error", e.getMessage(),
                    "cause", e.getCause() != null ? e.getCause().getMessage() : "unknown"));
        }
    }
}
