package com.medical.platform.dto;

import lombok.Data;

@Data
public class DoctorUpdateDTO {
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String address;
    private String gender;
    private String dateOfBirth;
    private String bloodGroup;
    private String specialization;
    private String licenseNumber;
    private Integer experienceYears;
    private Float consultationFee;
    private String languagesSpoken;
    private String profilePhoto;
    private String newPassword;
}
