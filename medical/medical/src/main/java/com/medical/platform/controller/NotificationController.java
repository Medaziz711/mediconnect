package com.medical.platform.controller;

import com.medical.platform.dto.DoctorNotificationDTO;
import com.medical.platform.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    
    private final NotificationService notificationService;
    
    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }
    
    /**
     * Get all unread notifications for current doctor
     * 
     * GET /api/notifications/unread
     * Access: DOCTOR only
     */
    @GetMapping("/unread")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<?> getUnreadNotifications() {
        try {
            List<DoctorNotificationDTO> notifications = notificationService.getUnreadNotificationsForDoctor();
            return ResponseEntity.ok(notifications);
        } catch (RuntimeException e) {
            System.err.println("Error getting notifications: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Unexpected error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
    
    /**
     * Get all notifications for current doctor (read and unread)
     * 
     * GET /api/notifications/all
     * Access: DOCTOR only
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<List<DoctorNotificationDTO>> getAllNotifications() {
        try {
            List<DoctorNotificationDTO> notifications = notificationService.getAllNotificationsForDoctor();
            return ResponseEntity.ok(notifications);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Mark notification as read
     * 
     * PUT /api/notifications/{id}/read
     * Access: DOCTOR only
     */
    @PutMapping("/{id}/read")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Void> markNotificationAsRead(@PathVariable Long id) {
        try {
            notificationService.markNotificationAsRead(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
