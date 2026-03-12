package com.medical.platform.controller;

import com.medical.platform.dto.CreatePrescriptionDTO;
import com.medical.platform.dto.PrescriptionDTO;
import com.medical.platform.service.PrescriptionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {
    
    private final PrescriptionService prescriptionService;
    
    public PrescriptionController(PrescriptionService prescriptionService) {
        this.prescriptionService = prescriptionService;
    }
    
    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<PrescriptionDTO> createPrescription(@Valid @RequestBody CreatePrescriptionDTO dto) {
        try {
            PrescriptionDTO prescription = prescriptionService.createPrescription(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(prescription);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/patient/{id}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'PHARMACIST')")
    public ResponseEntity<List<PrescriptionDTO>> getPrescriptionsByPatient(@PathVariable Long id) {
        try {
            List<PrescriptionDTO> prescriptions = prescriptionService.getPrescriptionsByPatient(id);
            return ResponseEntity.ok(prescriptions);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/doctor/{id}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'PHARMACIST')")
    public ResponseEntity<List<PrescriptionDTO>> getPrescriptionsByDoctor(@PathVariable Long id) {
        try {
            List<PrescriptionDTO> prescriptions = prescriptionService.getPrescriptionsByDoctor(id);
            return ResponseEntity.ok(prescriptions);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/pharmacist")
    @PreAuthorize("hasRole('PHARMACIST')")
    public ResponseEntity<List<PrescriptionDTO>> getAllPrescriptionsForPharmacist() {
        try {
            List<PrescriptionDTO> prescriptions = prescriptionService.getAllPrescriptionsForPharmacist();
            return ResponseEntity.ok(prescriptions);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}



