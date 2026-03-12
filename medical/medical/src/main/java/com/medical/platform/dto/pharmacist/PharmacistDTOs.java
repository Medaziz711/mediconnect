package com.medical.platform.dto.pharmacist;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class PharmacistDTOs {

    @Data
    public static class DashboardStatsDTO {
        private long totalMedicines;
        private long lowStockCount;
        private long pendingPrescriptions;
        private long fulfilledToday;
    }

    // PharmacistProfileDTO and PharmacyDTO have been moved to their own top-level
    // classes

    @Data
    public static class PharmacyUpdateDTO {
        private String name;
        private String address;
        private String phone;
        private String horairesOuverture;
        private Double latitude;
        private Double longitude;
        private Boolean open24h;
    }

    @Data
    public static class MedicineStockDTO {
        private Long id; // StockMedicament ID
        private Long medicineId; // Medicament ID
        private String medicineName;
        private String dci;
        private String form;
        private String dosage;
        private String manufacturer;
        private int quantity;
        private Float price;
        private LocalDate expiryDate;
        private int alertThreshold;
        private String emplacement;
        private boolean isLowStock;
    }

    @Data
    public static class AddMedicineDTO {
        private String name;
        private String dci;
        private String form;
        private String dosage;
        private String manufacturer;
        private int quantity;
        private Float price;
        private LocalDate expiryDate;
        private int alertThreshold;
        private String emplacement;
        private Long existingMedicineId; // If adding stock to an existing medicine
    }

    @Data
    public static class UpdateStockDTO {
        private Integer quantity;
        private Float price;
        private LocalDate expiryDate;
        private Integer alertThreshold;
        private String emplacement;
    }

    @Data
    public static class PrescriptionDTO {
        private Long id;
        private Long patientId;
        private String patientName;
        private Long doctorId;
        private String doctorName;
        private LocalDate prescriptionDate;
        private String status;
        private String medicines;
        private String instructions;
        private Boolean renewable;
    }

    @Data
    public static class FulfillPrescriptionDTO {
        private String notes;
    }
}
