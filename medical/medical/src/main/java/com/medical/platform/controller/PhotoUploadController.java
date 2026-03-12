package com.medical.platform.controller;

import com.medical.platform.entity.Admin;
import com.medical.platform.entity.Medecin;
import com.medical.platform.entity.Patient;
import com.medical.platform.entity.Pharmacien;

import com.medical.platform.repository.AdminRepository;
import com.medical.platform.repository.MedecinRepository;
import com.medical.platform.repository.PatientRepository;
import com.medical.platform.repository.PharmacienRepository;
import com.medical.platform.service.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.Map;

@RestController
@RequestMapping("/api/profiles")
public class PhotoUploadController {

    private final FileStorageService fileStorageService;
    private final MedecinRepository medecinRepository;
    private final PatientRepository patientRepository;
    private final PharmacienRepository pharmacienRepository;
    private final AdminRepository adminRepository;

    public PhotoUploadController(FileStorageService fileStorageService,
            MedecinRepository medecinRepository,
            PatientRepository patientRepository,
            PharmacienRepository pharmacienRepository,
            AdminRepository adminRepository) {
        this.fileStorageService = fileStorageService;
        this.medecinRepository = medecinRepository;
        this.patientRepository = patientRepository;
        this.pharmacienRepository = pharmacienRepository;
        this.adminRepository = adminRepository;
    }

    @PostMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadPhoto(@RequestParam("id") Long id,
            @RequestParam("role") String role,
            @RequestParam("file") MultipartFile file) {
        System.out.println("========== PHOTO_UPLOAD_CONTROLLER DEBUG ==========");
        System.out.println("1. Method called for Role: " + role + " ID: " + id);
        System.out.println("2. File is null? " + (file == null));
        if (file != null) {
            System.out.println("3. File name: " + file.getOriginalFilename());
            System.out.println("4. File size: " + file.getSize());
            System.out.println("5. Content type: " + file.getContentType());
        }
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }

            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body("Only image files are allowed");
            }

            String prefix = role.toLowerCase() + "-" + id;
            String fileName = fileStorageService.storeFile(file, prefix);

            // Update database based on role
            switch (role.toUpperCase()) {
                case "DOCTOR":
                case "MEDECIN":
                    medecinRepository.findById(id).ifPresent(m -> {
                        if (m.getProfilePhoto() != null && m.getProfilePhoto().contains("/api/profiles/photo/")) {
                            String oldFile = m.getProfilePhoto().substring(m.getProfilePhoto().lastIndexOf("/") + 1);
                            fileStorageService.deleteFile(oldFile);
                        }
                        m.setProfilePhoto("/api/profiles/photo/" + fileName);
                        medecinRepository.save(m);
                    });
                    break;
                case "PATIENT":
                    patientRepository.findById(id).ifPresent(p -> {
                        if (p.getProfilePhoto() != null && p.getProfilePhoto().contains("/api/profiles/photo/")) {
                            String oldFile = p.getProfilePhoto().substring(p.getProfilePhoto().lastIndexOf("/") + 1);
                            fileStorageService.deleteFile(oldFile);
                        }
                        p.setProfilePhoto("/api/profiles/photo/" + fileName);
                        patientRepository.save(p);
                    });
                    break;
                case "PHARMACIST":
                case "PHARMACIEN":
                    pharmacienRepository.findById(id).ifPresent(ph -> {
                        if (ph.getProfilePhoto() != null && ph.getProfilePhoto().contains("/api/profiles/photo/")) {
                            String oldFile = ph.getProfilePhoto().substring(ph.getProfilePhoto().lastIndexOf("/") + 1);
                            fileStorageService.deleteFile(oldFile);
                        }
                        ph.setProfilePhoto("/api/profiles/photo/" + fileName);
                        pharmacienRepository.save(ph);
                    });
                    break;
                case "ADMIN":
                    adminRepository.findById(id).ifPresent(a -> {
                        if (a.getProfilePhoto() != null && a.getProfilePhoto().contains("/api/profiles/photo/")) {
                            String oldFile = a.getProfilePhoto().substring(a.getProfilePhoto().lastIndexOf("/") + 1);
                            fileStorageService.deleteFile(oldFile);
                        }
                        a.setProfilePhoto("/api/profiles/photo/" + fileName);
                        adminRepository.save(a);
                    });
                    break;
                default:
                    return ResponseEntity.badRequest().body("Invalid role: " + role);
            }

            String photoUrl = "/api/profiles/photo/" + fileName;
            return ResponseEntity.ok(Map.of(
                    "photoUrl", photoUrl,
                    "message", "Photo uploaded and saved to database successfully"));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error uploading photo: " + e.getMessage());
        }
    }

    @GetMapping("/photo/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            Path filePath = fileStorageService.getFilePath(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() || resource.isReadable()) {
                String contentType = "image/jpeg"; // default
                if (filename.toLowerCase().endsWith(".png"))
                    contentType = "image/png";
                if (filename.toLowerCase().endsWith(".gif"))
                    contentType = "image/gif";
                if (filename.toLowerCase().endsWith(".webp"))
                    contentType = "image/webp";

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
