package com.medical.platform.dto;
 
import lombok.Data;
 
@Data
public class GoogleLoginRequestDTO {
    private String idToken;
    private String email;
    private String name;
    private String role;
}
