package com.medical.platform.controller;

import com.medical.platform.dto.ConsultationDTO;
import com.medical.platform.dto.CreateConsultationDTO;
import com.medical.platform.service.ConsultationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/consultations")
public class ConsultationController {
    
    private final ConsultationService consultationService;
    
    public ConsultationController(ConsultationService consultationService) {
        this.consultationService = consultationService;
    }
    
    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ConsultationDTO> createConsultation(@Valid @RequestBody CreateConsultationDTO dto) {
        try {
            ConsultationDTO consultation = consultationService.createConsultation(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(consultation);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/patient/{id}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR')")
    public ResponseEntity<List<ConsultationDTO>> getConsultationsByPatient(@PathVariable Long id) {
        try {
            List<ConsultationDTO> consultations = consultationService.getConsultationsByPatient(id);
            return ResponseEntity.ok(consultations);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/doctor/{id}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR')")
    public ResponseEntity<List<ConsultationDTO>> getConsultationsByDoctor(@PathVariable Long id) {
        try {
            List<ConsultationDTO> consultations = consultationService.getConsultationsByDoctor(id);
            return ResponseEntity.ok(consultations);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}



