package com.medical.platform.controller;

import com.medical.platform.dto.DemandeInscriptionDTO;
import com.medical.platform.dto.UserResponseDTO;
import com.medical.platform.entity.DemandesInscription;
import com.medical.platform.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    /**
     * List pending registration requests (doctors and pharmacists).
     * GET /api/admin/demandes
     * In production: restrict to users with role ADMIN (e.g. via @PreAuthorize or
     * filter).
     */
    @GetMapping("/demandes")
    public ResponseEntity<List<DemandeInscriptionDTO>> getPendingDemandes() {
        return ResponseEntity.ok(adminService.getPendingDemandes());
    }

    /**
     * Accept a registration request. Admin user ID should come from auth (e.g.
     * JWT).
     * POST /api/admin/demandes/{id}/accept
     * Body: { "adminUserId": 1 }
     */
    @PostMapping("/demandes/{id}/accept")
    public ResponseEntity<?> acceptDemande(@PathVariable Long id,
            @RequestBody(required = false) AcceptRejectRequest body) {
        try {
            Long adminId = body != null && body.getAdminUserId() != null ? body.getAdminUserId() : 1L;
            adminService.acceptDemande(id, adminId);
            return ResponseEntity.ok().body("Demande accepted. Email sent to the user.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    /**
     * Reject a registration request.
     * POST /api/admin/demandes/{id}/reject
     * Body: { "adminUserId": 1, "motifRejet": "Optional reason" }
     */
    @PostMapping("/demandes/{id}/reject")
    public ResponseEntity<?> rejectDemande(@PathVariable Long id, @RequestBody(required = false) RejectRequest body) {
        try {
            Long adminId = body != null && body.getAdminUserId() != null ? body.getAdminUserId() : 1L;
            String motif = body != null ? body.getMotifRejet() : null;
            adminService.rejectDemande(id, adminId, motif != null ? motif : "No reason provided.");
            return ResponseEntity.ok().body("Demande rejected. Email sent to the user.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    /**
     * Get all pending requests from both medecins and pharmaciens tables.
     * GET /api/admin/pending-requests
     */
    @GetMapping("/pending-requests")
    public ResponseEntity<List<com.medical.platform.dto.PendingRequestDTO>> getPendingRequests(
            @RequestParam(required = false) String role) {
        return ResponseEntity.ok(adminService.getPendingRequests(role));
    }

    /**
     * Approve a user (doctor or pharmacist).
     * POST /api/admin/approve/{userId}
     */
    @PostMapping("/approve/{userId}")
    public ResponseEntity<?> approveUser(@PathVariable Long userId) {
        try {
            adminService.approveUser(userId);
            return ResponseEntity.ok("User successfully approved.");
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return ResponseEntity.status(404).body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Internal server error: " + e.getMessage());
        }
    }

    /**
     * Reject a user (doctor or pharmacist).
     * POST /api/admin/reject/{userId}
     * Body: { "rejectionReason": "Reason..." }
     */
    @PostMapping("/reject/{userId}")
    public ResponseEntity<?> rejectUser(@PathVariable Long userId,
            @RequestBody(required = false) com.medical.platform.dto.RejectionRequestDTO body) {
        try {
            String reason = (body != null && body.getRejectionReason() != null) ? body.getRejectionReason()
                    : "No reason provided.";
            adminService.rejectUser(userId, reason);
            return ResponseEntity.ok("User successfully rejected.");
        } catch (RuntimeException e) {
            if (e.getMessage() != null && e.getMessage().contains("not found")) {
                return ResponseEntity.status(404).body(e.getMessage());
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Internal server error: " + e.getMessage());
        }
    }

    /**
     * List all users across all tables.
     * GET /api/admin/users
     */
    @GetMapping("/users")
    public ResponseEntity<List<UserResponseDTO>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    /**
     * Delete a user by ID and role.
     * DELETE /api/admin/users/{role}/{id}
     */
    @DeleteMapping("/users/{role}/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String role, @PathVariable Long id) {
        try {
            adminService.deleteUser(id, role);
            return ResponseEntity.ok().body("User deleted successfully.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @lombok.Data
    public static class AcceptRejectRequest {
        private Long adminUserId; // admin id from admins table
    }

    @lombok.Data
    public static class RejectRequest {
        private Long adminUserId;
        private String motifRejet;
    }
}
