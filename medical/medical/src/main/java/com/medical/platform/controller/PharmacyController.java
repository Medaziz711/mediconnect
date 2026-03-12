package com.medical.platform.controller;

import com.medical.platform.dto.PharmacyResponseDTO;
import com.medical.platform.entity.Pharmacie;
import com.medical.platform.repository.PharmacieRepository;
import com.medical.platform.util.DistanceCalculator;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/pharmacies")
@CrossOrigin(origins = "*")
public class PharmacyController {

    private final PharmacieRepository pharmacieRepository;
    private final DistanceCalculator distanceCalculator;

    public PharmacyController(PharmacieRepository pharmacieRepository, DistanceCalculator distanceCalculator) {
        this.pharmacieRepository = pharmacieRepository;
        this.distanceCalculator = distanceCalculator;
    }

    @GetMapping
    public ResponseEntity<List<PharmacyResponseDTO>> getPharmacies(
            @RequestParam(required = false) Double latitude,
            @RequestParam(required = false) Double longitude,
            @RequestParam(required = false) Double radius) {

        List<Pharmacie> pharmacies = pharmacieRepository.findAll();

        List<PharmacyResponseDTO> dtos = pharmacies.stream()
                .map(p -> {
                    double distance = 0.0;
                    if (latitude != null && longitude != null && p.getLatitude() != null && p.getLongitude() != null) {
                        distance = distanceCalculator.calculateDistanceRounded(
                                latitude, longitude,
                                p.getLatitude().doubleValue(), p.getLongitude().doubleValue()
                        );
                    }

                    return new PharmacyResponseDTO(
                            p.getId(),
                            p.getPharmacien() != null ? p.getPharmacien().getNom() + " " + p.getPharmacien().getPrenom() : "N/A",
                            p.getPharmacien() != null ? p.getPharmacien().getEmail() : "N/A",
                            p.getNom(),
                            p.getAdresse(),
                            p.getTelephone(),
                            "PHARMACIST",
                            p.getPharmacien() != null ? p.getPharmacien().getStatut().name() : "ACTIF",
                            p.getLatitude() != null ? p.getLatitude().doubleValue() : null,
                            p.getLongitude() != null ? p.getLongitude().doubleValue() : null,
                            distance,
                            p.getOuvert24h()
                    );
                })
                .filter(dto -> radius == null || (dto.getDistance() != null && dto.getDistance() <= radius))
                .sorted((a, b) -> Double.compare(a.getDistance(), b.getDistance()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
}
