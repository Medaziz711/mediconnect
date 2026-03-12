package com.medical.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PharmacyInfoDTO {
    private String name;
    private String address;
    private Double distanceKm;
    private Integer quantity;
}
