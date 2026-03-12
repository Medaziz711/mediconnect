package com.medical.platform.service;

import com.medical.platform.dto.pharmacist.PharmacistDTOs.*;
import com.medical.platform.dto.PharmacistProfileDTO;
import com.medical.platform.dto.PharmacistUpdateDTO;
import com.medical.platform.dto.PharmacyDTO;
import com.medical.platform.entity.*;
import com.medical.platform.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class PharmacistService {

    private final PharmacienRepository pharmacienRepository;
    private final PharmacieRepository pharmacieRepository;
    private final StockMedicamentRepository stockMedicamentRepository;
    private final MedicamentRepository medicamentRepository;
    private final OrdonnanceRepository ordonnanceRepository;

    public PharmacistService(PharmacienRepository pharmacienRepository,
            PharmacieRepository pharmacieRepository,
            StockMedicamentRepository stockMedicamentRepository,
            MedicamentRepository medicamentRepository,
            OrdonnanceRepository ordonnanceRepository) {
        this.pharmacienRepository = pharmacienRepository;
        this.pharmacieRepository = pharmacieRepository;
        this.stockMedicamentRepository = stockMedicamentRepository;
        this.medicamentRepository = medicamentRepository;
        this.ordonnanceRepository = ordonnanceRepository;
    }

    private Pharmacien getPharmacistByEmail(String email) {
        return pharmacienRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Pharmacist not found with email: " + email));
    }

    private Pharmacie getPharmacyByEmail(String email) {
        Pharmacien pharmacien = getPharmacistByEmail(email);
        return pharmacieRepository.findByPharmacienId(pharmacien.getId())
                .orElseThrow(() -> new RuntimeException("Pharmacy not found for pharmacist: " + email));
    }

    public PharmacistProfileDTO getPharmacistProfile(Long userId) {
        Pharmacien pharmacien = pharmacienRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Pharmacist not found"));

        Optional<Pharmacie> pharmacieOpt = pharmacieRepository.findByPharmacienId(userId);

        PharmacistProfileDTO dto = new PharmacistProfileDTO();
        dto.setId(pharmacien.getId());
        dto.setFirstName(pharmacien.getPrenom());
        dto.setLastName(pharmacien.getNom());
        dto.setEmail(pharmacien.getEmail());
        dto.setPhone(pharmacien.getTelephone());
        dto.setAddress(pharmacien.getAdresse());
        dto.setProfilePhoto(pharmacien.getProfilePhoto());
        dto.setLicenseNumber(pharmacien.getNumeroOrdre());
        dto.setStatus(pharmacien.getStatut() != null ? pharmacien.getStatut().name() : null);
        dto.setCreatedAt(pharmacien.getDateInscription());

        if (pharmacieOpt.isPresent()) {
            Pharmacie pharmacie = pharmacieOpt.get();
            PharmacyDTO pharmacyDTO = new PharmacyDTO();
            pharmacyDTO.setId(pharmacie.getId());
            pharmacyDTO.setName(pharmacie.getNom());
            pharmacyDTO.setAddress(pharmacie.getAdresse());
            pharmacyDTO.setPhone(pharmacie.getTelephone());
            pharmacyDTO.setHours(pharmacie.getHorairesOuverture());
            pharmacyDTO.setOpen24Hours(pharmacie.getOuvert24h());
            pharmacyDTO.setLatitude(pharmacie.getLatitude());
            pharmacyDTO.setLongitude(pharmacie.getLongitude());
            dto.setPharmacy(pharmacyDTO);
        }

        return dto;
    }

    public DashboardStatsDTO getDashboardStats(String email) {
        Pharmacie pharmacie = getPharmacyByEmail(email);

        long totalMedicines = stockMedicamentRepository.countByPharmacie(pharmacie);

        List<StockMedicament> stock = stockMedicamentRepository.findByPharmacie(pharmacie);
        long lowStockCount = stock.stream()
                .filter(s -> s.getQuantiteDisponible() <= (s.getSeuilAlerte() != null ? s.getSeuilAlerte() : 10))
                .count();

        long pendingPrescriptions = ordonnanceRepository.findAll().stream()
                .filter(o -> o.getStatut() == Ordonnance.StatutOrdonnance.validee)
                .count();

        long fulfilledToday = ordonnanceRepository.findAll().stream()
                .filter(o -> o.getStatut() == Ordonnance.StatutOrdonnance.servie)
                .count(); // In a real app, track timestamps for fulfillment

        DashboardStatsDTO stats = new DashboardStatsDTO();
        stats.setTotalMedicines(totalMedicines);
        stats.setLowStockCount(lowStockCount);
        stats.setPendingPrescriptions(pendingPrescriptions);
        stats.setFulfilledToday(fulfilledToday);
        return stats;
    }

    public PharmacistProfileDTO getProfile(String email) {
        Pharmacien p = getPharmacistByEmail(email);
        return getPharmacistProfile(p.getId());
    }

    public PharmacistProfileDTO updateProfile(String email, PharmacistUpdateDTO dto) {
        Pharmacien p = getPharmacistByEmail(email);
        if (dto.getFirstName() != null)
            p.setPrenom(dto.getFirstName());
        if (dto.getLastName() != null)
            p.setNom(dto.getLastName());
        if (dto.getPhone() != null)
            p.setTelephone(dto.getPhone());
        if (dto.getAddress() != null)
            p.setAdresse(dto.getAddress());
        pharmacienRepository.save(p);
        return getProfile(email);
    }

    public PharmacyDTO getPharmacy(String email) {
        Pharmacie p = getPharmacyByEmail(email);
        return mapToPharmacyDTO(p);
    }

    public PharmacyDTO updatePharmacy(String email, PharmacyUpdateDTO dto) {
        Pharmacie p = getPharmacyByEmail(email);
        if (dto.getName() != null)
            p.setNom(dto.getName());
        if (dto.getAddress() != null)
            p.setAdresse(dto.getAddress());
        if (dto.getPhone() != null)
            p.setTelephone(dto.getPhone());
        if (dto.getHorairesOuverture() != null)
            p.setHorairesOuverture(dto.getHorairesOuverture());
        if (dto.getLatitude() != null)
            p.setLatitude(dto.getLatitude());
        if (dto.getLongitude() != null)
            p.setLongitude(dto.getLongitude());
        if (dto.getOpen24h() != null)
            p.setOuvert24h(dto.getOpen24h());
        pharmacieRepository.save(p);
        return mapToPharmacyDTO(p);
    }

    private PharmacyDTO mapToPharmacyDTO(Pharmacie p) {
        PharmacyDTO dto = new PharmacyDTO();
        dto.setId(p.getId());
        dto.setName(p.getNom());
        dto.setAddress(p.getAdresse());
        dto.setPhone(p.getTelephone());
        dto.setHours(p.getHorairesOuverture());
        dto.setLatitude(p.getLatitude());
        dto.setLongitude(p.getLongitude());
        dto.setOpen24Hours(p.getOuvert24h());
        return dto;
    }

    public List<MedicineStockDTO> getStock(String email) {
        Pharmacie p = getPharmacyByEmail(email);
        return stockMedicamentRepository.findByPharmacie(p).stream()
                .map(this::mapToMedicineStockDTO)
                .collect(Collectors.toList());
    }

    public List<MedicineStockDTO> getLowStock(String email) {
        Pharmacie p = getPharmacyByEmail(email);
        return stockMedicamentRepository.findByPharmacie(p).stream()
                .filter(s -> s.getQuantiteDisponible() <= (s.getSeuilAlerte() != null ? s.getSeuilAlerte() : 10))
                .map(this::mapToMedicineStockDTO)
                .collect(Collectors.toList());
    }

    public List<MedicineStockDTO> getExpiringMedicines(String email) {
        Pharmacie p = getPharmacyByEmail(email);
        LocalDate limitDate = LocalDate.now().plusDays(30);
        return stockMedicamentRepository.findByPharmacie(p).stream()
                .filter(s -> s.getDatePeremption() != null && !s.getDatePeremption().isAfter(limitDate))
                .map(this::mapToMedicineStockDTO)
                .collect(Collectors.toList());
    }

    public MedicineStockDTO addMedicineToStock(String email, AddMedicineDTO dto) {
        Pharmacie p = getPharmacyByEmail(email);

        Medicament medicament;
        if (dto.getExistingMedicineId() != null) {
            medicament = medicamentRepository.findById(dto.getExistingMedicineId())
                    .orElseThrow(() -> new RuntimeException("Medicine not found"));
        } else {
            medicament = new Medicament();
            medicament.setNom(dto.getName());
            medicament.setDci(dto.getDci());
            medicament.setForme(dto.getForm());
            medicament.setDosage(dto.getDosage());
            medicament.setFabricant(dto.getManufacturer());
            medicament = medicamentRepository.save(medicament);
        }

        StockMedicament stock = new StockMedicament();
        stock.setPharmacie(p);
        stock.setMedicament(medicament);
        stock.setQuantiteDisponible(dto.getQuantity());
        stock.setPrixUnitaire(dto.getPrice());
        stock.setDatePeremption(dto.getExpiryDate());
        stock.setSeuilAlerte(dto.getAlertThreshold());
        stock.setEmplacement(dto.getEmplacement());

        return mapToMedicineStockDTO(stockMedicamentRepository.save(stock));
    }

    public MedicineStockDTO updateStock(String email, Long stockId, UpdateStockDTO dto) {
        Pharmacie p = getPharmacyByEmail(email); // authorization check
        StockMedicament stock = stockMedicamentRepository.findById(stockId)
                .orElseThrow(() -> new RuntimeException("Stock not found"));

        if (!stock.getPharmacie().getId().equals(p.getId())) {
            throw new RuntimeException("Unauthorized to modify this stock");
        }

        if (dto.getQuantity() != null)
            stock.setQuantiteDisponible(dto.getQuantity());
        if (dto.getPrice() != null)
            stock.setPrixUnitaire(dto.getPrice());
        if (dto.getExpiryDate() != null)
            stock.setDatePeremption(dto.getExpiryDate());
        if (dto.getAlertThreshold() != null)
            stock.setSeuilAlerte(dto.getAlertThreshold());
        if (dto.getEmplacement() != null)
            stock.setEmplacement(dto.getEmplacement());

        return mapToMedicineStockDTO(stockMedicamentRepository.save(stock));
    }

    public void removeFromStock(String email, Long stockId) {
        Pharmacie p = getPharmacyByEmail(email);
        StockMedicament stock = stockMedicamentRepository.findById(stockId)
                .orElseThrow(() -> new RuntimeException("Stock not found"));

        if (!stock.getPharmacie().getId().equals(p.getId())) {
            throw new RuntimeException("Unauthorized to modify this stock");
        }
        stockMedicamentRepository.delete(stock);
    }

    public List<MedicineStockDTO> searchMedicines(String email, String query) {
        Pharmacie p = getPharmacyByEmail(email);
        return stockMedicamentRepository.findByPharmacie(p).stream()
                .filter(s -> s.getMedicament().getNom().toLowerCase().contains(query.toLowerCase()))
                .map(this::mapToMedicineStockDTO)
                .collect(Collectors.toList());
    }

    private MedicineStockDTO mapToMedicineStockDTO(StockMedicament stock) {
        MedicineStockDTO dto = new MedicineStockDTO();
        dto.setId(stock.getId());
        dto.setMedicineId(stock.getMedicament().getId());
        dto.setMedicineName(stock.getMedicament().getNom());
        dto.setDci(stock.getMedicament().getDci());
        dto.setForm(stock.getMedicament().getForme());
        dto.setDosage(stock.getMedicament().getDosage());
        dto.setManufacturer(stock.getMedicament().getFabricant());
        dto.setQuantity(stock.getQuantiteDisponible() != null ? stock.getQuantiteDisponible() : 0);
        dto.setPrice(stock.getPrixUnitaire());
        dto.setExpiryDate(stock.getDatePeremption());
        dto.setAlertThreshold(stock.getSeuilAlerte() != null ? stock.getSeuilAlerte() : 10);
        dto.setEmplacement(stock.getEmplacement());
        dto.setLowStock(dto.getQuantity() <= dto.getAlertThreshold());
        return dto;
    }

    public List<PrescriptionDTO> getPendingPrescriptions() {
        return ordonnanceRepository.findAll().stream()
                .filter(o -> o.getStatut() == Ordonnance.StatutOrdonnance.validee)
                .map(this::mapToPrescriptionDTO)
                .collect(Collectors.toList());
    }

    public List<PrescriptionDTO> getFulfilledPrescriptions() {
        return ordonnanceRepository.findAll().stream()
                .filter(o -> o.getStatut() == Ordonnance.StatutOrdonnance.servie)
                .map(this::mapToPrescriptionDTO)
                .collect(Collectors.toList());
    }

    public PrescriptionDTO getPrescription(Long id) {
        Ordonnance o = ordonnanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));
        return mapToPrescriptionDTO(o);
    }

    public PrescriptionDTO fulfillPrescription(Long id, FulfillPrescriptionDTO dto) {
        Ordonnance o = ordonnanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));
        o.setStatut(Ordonnance.StatutOrdonnance.servie);
        // Notes could be saved somewhere if the schema supports it. Not currently
        // supported.
        return mapToPrescriptionDTO(ordonnanceRepository.save(o));
    }

    private PrescriptionDTO mapToPrescriptionDTO(Ordonnance o) {
        PrescriptionDTO dto = new PrescriptionDTO();
        dto.setId(o.getId());

        Consultation c = o.getConsultation();
        if (c != null && c.getRendezVous() != null) {
            Patient p = c.getRendezVous().getPatient();
            if (p != null) {
                dto.setPatientId(p.getId());
                dto.setPatientName(p.getNom() + " " + p.getPrenom());
            }
            Medecin m = c.getRendezVous().getMedecin();
            if (m != null) {
                dto.setDoctorId(m.getId());
                dto.setDoctorName(m.getNom() + " " + m.getPrenom());
            }
        }

        dto.setPrescriptionDate(o.getDateEmission());
        dto.setStatus(o.getStatut().name());
        dto.setRenewable(o.getRenouvelable());

        // Combine medicines into a string since no separate field exists
        String medicines = o.getLignes().stream()
                .map(l -> l.getMedicament().getNom() + " (" + l.getPosologie() + ")")
                .collect(Collectors.joining(", "));
        dto.setMedicines(medicines);

        String instructions = o.getLignes().stream()
                .map(l -> l.getInstructions())
                .filter(inst -> inst != null && !inst.isEmpty())
                .collect(Collectors.joining(" | "));
        dto.setInstructions(instructions);

        return dto;
    }
}
