package com.medical.platform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatbotRequestDTO {
    
    @NotBlank(message = "Medicine name is required")
    private String medicine;
    
    @NotNull(message = "User latitude is required")
    private Double userLatitude;
    
    @NotNull(message = "User longitude is required")
    private Double userLongitude;
}
