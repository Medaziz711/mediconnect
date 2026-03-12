package com.medical.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotResponseDTO {
    private Boolean available;
    private PharmacyInfoDTO nearestPharmacy;
    private List<PharmacyInfoDTO> otherPharmacies;
    private String message;
    private List<String> alternatives;
}
