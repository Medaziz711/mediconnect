package com.medical.platform.controller;

import com.medical.platform.dto.ChatbotRequestDTO;
import com.medical.platform.dto.ChatbotResponseDTO;
import com.medical.platform.service.ChatbotService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {
    
    private final ChatbotService chatbotService;
    
    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }
    
    /**
     * Check medicine availability in pharmacies
     * 
     * POST /api/chatbot/check-medicine
     * 
     * Access: DOCTOR, PATIENT
     */
    @PostMapping("/check-medicine")
    @PreAuthorize("hasAnyRole('DOCTOR', 'PATIENT')")
    public ResponseEntity<ChatbotResponseDTO> checkMedicine(@Valid @RequestBody ChatbotRequestDTO request) {
        try {
            ChatbotResponseDTO response = chatbotService.checkMedicineAvailability(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            // Log error
            System.err.println("Error checking medicine: " + e.getMessage());
            e.printStackTrace();
            
            // Return error response
            ChatbotResponseDTO errorResponse = new ChatbotResponseDTO();
            errorResponse.setAvailable(false);
            errorResponse.setMessage("Error occurred while checking medicine availability: " + e.getMessage());
            errorResponse.setAlternatives(new java.util.ArrayList<>());
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
}
