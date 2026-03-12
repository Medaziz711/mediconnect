package com.medical.platform.controller;

import com.medical.platform.dto.pharmacist.PharmacistDTOs.*;
import com.medical.platform.dto.PharmacistProfileDTO;
import com.medical.platform.dto.PharmacistUpdateDTO;
import com.medical.platform.dto.PharmacyDTO;
import com.medical.platform.security.CustomUserDetails;
import com.medical.platform.service.PharmacistService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/pharmacists")
@CrossOrigin(origins = "http://localhost:4200")
public class PharmacistController {

    private final PharmacistService pharmacistService;
    private final com.medical.platform.service.FileStorageService fileStorageService;

    public PharmacistController(PharmacistService pharmacistService,
            com.medical.platform.service.FileStorageService fileStorageService) {
        this.pharmacistService = pharmacistService;
        this.fileStorageService = fileStorageService;
    }

    private String getEmailFromAuth(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Unauthorized: Missing authentication");
        }
        return authentication.getName();
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats(Authentication authentication) {
        return ResponseEntity.ok(pharmacistService.getDashboardStats(getEmailFromAuth(authentication)));
    }

    @GetMapping("/profile")
    public ResponseEntity<PharmacistProfileDTO> getCurrentPharmacistProfile() {
        // Get current authenticated user ID from SecurityContext
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails)) {
            throw new RuntimeException("Unauthorized: User not authenticated correctly");
        }
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        Long userId = userDetails.getId();

        PharmacistProfileDTO profile = pharmacistService.getPharmacistProfile(userId);
        return ResponseEntity.ok(profile);
    }

    // get by ID (frontend expects this at /api/pharmacists/18)
    @GetMapping("/{id}")
    public ResponseEntity<PharmacistProfileDTO> getPharmacistById(@PathVariable Long id) {
        PharmacistProfileDTO profile = pharmacistService.getPharmacistProfile(id);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<PharmacistProfileDTO> updateProfile(Authentication authentication,
            @RequestBody PharmacistUpdateDTO updateDTO) {
        return ResponseEntity.ok(pharmacistService.updateProfile(getEmailFromAuth(authentication), updateDTO));
    }

    @PostMapping("/profile/photo")
    public ResponseEntity<?> uploadProfilePhoto(Authentication authentication,
            @RequestParam("file") MultipartFile file) {
        // Simple placeholder to prevent crash for now (actual file storage can be
        // handled separately)
        return ResponseEntity.status(501).body("Photo upload feature is under construction.");
    }

    @GetMapping("/profile/photo/{filename:.+}")
    public ResponseEntity<org.springframework.core.io.Resource> servePhoto(@PathVariable String filename) {
        // Use the same logic as PhotoUploadController
        try {
            java.nio.file.Path filePath = java.nio.file.Paths.get("uploads/profiles").resolve(filename).normalize();
            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(
                    filePath.toUri());

            if (resource.exists() || resource.isReadable()) {
                String contentType = "image/jpeg";
                if (filename.toLowerCase().endsWith(".png"))
                    contentType = "image/png";
                if (filename.toLowerCase().endsWith(".webp"))
                    contentType = "image/webp";

                return ResponseEntity.ok()
                        .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                        .body(resource);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/pharmacy")
    public ResponseEntity<PharmacyDTO> getPharmacy(Authentication authentication) {
        return ResponseEntity.ok(pharmacistService.getPharmacy(getEmailFromAuth(authentication)));
    }

    @PutMapping("/pharmacy")
    public ResponseEntity<PharmacyDTO> updatePharmacy(Authentication authentication,
            @RequestBody PharmacyUpdateDTO updateDTO) {
        return ResponseEntity.ok(pharmacistService.updatePharmacy(getEmailFromAuth(authentication), updateDTO));
    }

    @GetMapping("/stock")
    public ResponseEntity<List<MedicineStockDTO>> getStock(Authentication authentication) {
        return ResponseEntity.ok(pharmacistService.getStock(getEmailFromAuth(authentication)));
    }

    @GetMapping("/stock/low-stock")
    public ResponseEntity<List<MedicineStockDTO>> getLowStock(Authentication authentication) {
        return ResponseEntity.ok(pharmacistService.getLowStock(getEmailFromAuth(authentication)));
    }

    @GetMapping("/stock/expiring")
    public ResponseEntity<List<MedicineStockDTO>> getExpiringMedicines(Authentication authentication) {
        return ResponseEntity.ok(pharmacistService.getExpiringMedicines(getEmailFromAuth(authentication)));
    }

    @PostMapping("/stock")
    public ResponseEntity<MedicineStockDTO> addMedicineToStock(Authentication authentication,
            @RequestBody AddMedicineDTO addDTO) {
        return ResponseEntity.ok(pharmacistService.addMedicineToStock(getEmailFromAuth(authentication), addDTO));
    }

    @PutMapping("/stock/{id}")
    public ResponseEntity<MedicineStockDTO> updateStock(Authentication authentication, @PathVariable Long id,
            @RequestBody UpdateStockDTO updateDTO) {
        return ResponseEntity.ok(pharmacistService.updateStock(getEmailFromAuth(authentication), id, updateDTO));
    }

    @DeleteMapping("/stock/{id}")
    public ResponseEntity<Void> removeFromStock(Authentication authentication, @PathVariable Long id) {
        pharmacistService.removeFromStock(getEmailFromAuth(authentication), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stock/search")
    public ResponseEntity<List<MedicineStockDTO>> searchMedicines(Authentication authentication,
            @RequestParam String q) {
        return ResponseEntity.ok(pharmacistService.searchMedicines(getEmailFromAuth(authentication), q));
    }

    @GetMapping("/prescriptions/pending")
    public ResponseEntity<List<PrescriptionDTO>> getPendingPrescriptions(Authentication authentication) {
        return ResponseEntity.ok(pharmacistService.getPendingPrescriptions());
    }

    @GetMapping("/prescriptions/fulfilled")
    public ResponseEntity<List<PrescriptionDTO>> getFulfilledPrescriptions(Authentication authentication) {
        return ResponseEntity.ok(pharmacistService.getFulfilledPrescriptions());
    }

    @GetMapping("/prescriptions/{id}")
    public ResponseEntity<PrescriptionDTO> getPrescription(Authentication authentication, @PathVariable Long id) {
        return ResponseEntity.ok(pharmacistService.getPrescription(id));
    }

    @PostMapping("/prescriptions/{id}/fulfill")
    public ResponseEntity<PrescriptionDTO> fulfillPrescription(Authentication authentication, @PathVariable Long id,
            @RequestBody FulfillPrescriptionDTO fulfillDTO) {
        return ResponseEntity.ok(pharmacistService.fulfillPrescription(id, fulfillDTO));
    }
}
