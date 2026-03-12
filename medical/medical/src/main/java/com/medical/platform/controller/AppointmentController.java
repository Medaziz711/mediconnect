package com.medical.platform.controller;

import com.medical.platform.dto.AppointmentDTO;
import com.medical.platform.dto.CreateAppointmentDTO;
import com.medical.platform.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {
    
    private final AppointmentService appointmentService;
    
    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }
    
    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<?> createAppointment(@Valid @RequestBody CreateAppointmentDTO dto) {
        try {
            AppointmentDTO appointment = appointmentService.createAppointment(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(appointment);
        } catch (RuntimeException e) {
            // Log error for debugging
            System.err.println("Error creating appointment: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    @GetMapping("/patient/{id}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR')")
    public ResponseEntity<?> getAppointmentsByPatient(@PathVariable Long id) {
        try {
            List<AppointmentDTO> appointments = appointmentService.getAppointmentsByPatient(id);
            return ResponseEntity.ok(appointments);
        } catch (RuntimeException e) {
            System.err.println("Error getting appointments: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    @GetMapping("/doctor/{id}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR')")
    public ResponseEntity<?> getAppointmentsByDoctor(@PathVariable Long id) {
        try {
            List<AppointmentDTO> appointments = appointmentService.getAppointmentsByDoctor(id);
            return ResponseEntity.ok(appointments);
        } catch (RuntimeException e) {
            System.err.println("Error getting doctor appointments: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    @PutMapping("/{id}/confirm")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<AppointmentDTO> confirmAppointment(@PathVariable Long id) {
        try {
            AppointmentDTO appointment = appointmentService.confirmAppointment(id);
            return ResponseEntity.ok(appointment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR')")
    public ResponseEntity<AppointmentDTO> cancelAppointment(@PathVariable Long id) {
        try {
            AppointmentDTO appointment = appointmentService.cancelAppointment(id);
            return ResponseEntity.ok(appointment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}



