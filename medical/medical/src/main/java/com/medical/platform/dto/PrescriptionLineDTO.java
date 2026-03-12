package com.medical.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrescriptionLineDTO {
    private Long id;
    private String dosage;
    private String duration;
    private String instructions;
    private Long medicineId;
    private String medicineName;
    private String medicineForm;
    private String medicineDosage;
}



