package com.medical.platform.controller;

import com.medical.platform.dto.MedicalRecordDTO;
import com.medical.platform.dto.UpdateMedicalRecordDTO;
import com.medical.platform.service.MedicalRecordService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/medical-records")
public class MedicalRecordController {
    
    private final MedicalRecordService medicalRecordService;
    
    public MedicalRecordController(MedicalRecordService medicalRecordService) {
        this.medicalRecordService = medicalRecordService;
    }
    
    @GetMapping("/patient/{id}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR')")
    public ResponseEntity<MedicalRecordDTO> getMedicalRecordByPatient(@PathVariable Long id) {
        try {
            MedicalRecordDTO record = medicalRecordService.getMedicalRecordByPatient(id);
            return ResponseEntity.ok(record);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<MedicalRecordDTO> updateMedicalRecord(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMedicalRecordDTO dto) {
        try {
            MedicalRecordDTO record = medicalRecordService.updateMedicalRecord(id, dto);
            return ResponseEntity.ok(record);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}



