# Complete API Endpoints Documentation
## Medical Pharmacy Platform - Frontend Integration Guide

**Base URL:** `http://localhost:8081/api`

---

## 📋 Table of Contents
1. [Authentication](#authentication)
2. [Appointments](#appointments)
3. [Consultations](#consultations)
4. [Prescriptions](#prescriptions)
5. [Medical Records](#medical-records)
6. [Chatbot](#chatbot)
7. [Notifications](#notifications)

---

## 🔐 Authentication

### 0. Register User
**POST** `/api/users`

**Access:** Public (anyone can register)

**Request Body:**
```json
{
  "name": "John Patient",
  "email": "john.patient@example.com",
  "password": "password123",
  "phone": "1234567890",
  "address": "123 Main St",
  "role": "PATIENT",
  "dateOfBirth": "1990-05-15",
  "bloodGroup": "O+"
}
```

**Request Body (Doctor):**
```json
{
  "name": "Dr. Jane Smith",
  "email": "doctor@example.com",
  "password": "password123",
  "phone": "0987654321",
  "address": "456 Medical St",
  "role": "DOCTOR",
  "specialization": "Cardiology",
  "licenseNumber": "DOC12345",
  "yearsOfExperience": "10",
  "qualifications": "MD, MBBS"
}
```

**Response (201 Created):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 4,
    "name": "John Patient",
    "email": "john.patient@example.com",
    "phone": "1234567890",
    "address": "123 Main St",
    "role": "PATIENT",
    "enabled": true,
    "createdAt": "2026-01-20T22:00:00"
  },
  "token": null
}
```

---

### 0.1. Login User
**POST** `/api/users/login`

**Access:** Public

**Request Body:**
```json
{
  "email": "patient@medical.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 2,
    "name": "Jane Doe",
    "email": "patient@medical.com",
    "phone": "0987654321",
    "address": "456 Patient Ave, City",
    "role": "PATIENT",
    "enabled": true,
    "createdAt": "2026-01-20T20:00:00"
  },
  "token": null
}
```

**Error Response (400 Bad Request):**
```json
"Error: Invalid email or password"
```

---

### 0.2. Get User by Email
**GET** `/api/users/email/{email}`

**Access:** Public (for testing)

**Example:** `GET /api/users/email/patient@medical.com`

**Response (200 OK):**
```json
{
  "id": 2,
  "name": "Jane Doe",
  "email": "patient@medical.com",
  "phone": "0987654321",
  "address": "456 Patient Ave, City",
  "role": "PATIENT",
  "enabled": true,
  "createdAt": "2026-01-20T20:00:00"
}
```

---

### 0.3. Get User by ID
**GET** `/api/users/{id}`

**Access:** Public (for testing)

**Example:** `GET /api/users/2`

**Response (200 OK):**
```json
{
  "id": 2,
  "name": "Jane Doe",
  "email": "patient@medical.com",
  "phone": "0987654321",
  "address": "456 Patient Ave, City",
  "role": "PATIENT",
  "enabled": true,
  "createdAt": "2026-01-20T20:00:00"
}
```

---

## 🏥 Appointments

### 1. Create Appointment
**POST** `/api/appointments`

**Access:** PATIENT only

**Request Body:**
```json
{
  "doctorId": 1,
  "dateTime": "2024-12-20T10:30:00",
  "duration": 30,
  "reason": "Regular checkup"
}
```

**Response (201 Created):**
```json
{
  "id": 2,
  "patientId": 2,
  "patientName": "Jane Doe",
  "doctorId": 1,
  "doctorName": "Dr. John Smith",
  "dateTime": "2024-12-20T10:30:00",
  "duration": 30,
  "status": "SCHEDULED",
  "reason": "Regular checkup",
  "notes": null,
  "createdAt": "2026-01-20T20:44:40",
  "updatedAt": "2026-01-20T20:44:40"
}
```

---

### 2. Get Appointments by Patient
**GET** `/api/appointments/patient/{id}`

**Access:** PATIENT, DOCTOR

**Example:** `GET /api/appointments/patient/2`

**Response (200 OK):**
```json
[
  {
    "id": 2,
    "patientId": 2,
    "patientName": "Jane Doe",
    "doctorId": 1,
    "doctorName": "Dr. John Smith",
    "dateTime": "2024-12-20T10:30:00",
    "duration": 30,
    "status": "SCHEDULED",
    "reason": "Regular checkup",
    "notes": null,
    "createdAt": "2026-01-20T20:44:40",
    "updatedAt": "2026-01-20T20:44:40"
  }
]
```

---

### 3. Get Appointments by Doctor
**GET** `/api/appointments/doctor/{id}`

**Access:** PATIENT, DOCTOR

**Example:** `GET /api/appointments/doctor/1`

**Response (200 OK):**
```json
[
  {
    "id": 2,
    "patientId": 2,
    "patientName": "Jane Doe",
    "doctorId": 1,
    "doctorName": "Dr. John Smith",
    "dateTime": "2024-12-20T10:30:00",
    "duration": 30,
    "status": "SCHEDULED",
    "reason": "Regular checkup",
    "notes": null,
    "createdAt": "2026-01-20T20:44:40",
    "updatedAt": "2026-01-20T20:44:40"
  }
]
```

---

### 4. Confirm Appointment
**PUT** `/api/appointments/{id}/confirm`

**Access:** DOCTOR only

**Example:** `PUT /api/appointments/2/confirm`

**Response (200 OK):**
```json
{
  "id": 2,
  "patientId": 2,
  "patientName": "Jane Doe",
  "doctorId": 1,
  "doctorName": "Dr. John Smith",
  "dateTime": "2024-12-20T10:30:00",
  "duration": 30,
  "status": "IN_PROGRESS",
  "reason": "Regular checkup",
  "notes": null,
  "createdAt": "2026-01-20T20:44:40",
  "updatedAt": "2026-01-20T20:44:40"
}
```

---

### 5. Cancel Appointment
**PUT** `/api/appointments/{id}/cancel`

**Access:** PATIENT, DOCTOR

**Example:** `PUT /api/appointments/2/cancel`

**Response (200 OK):**
```json
{
  "id": 2,
  "patientId": 2,
  "patientName": "Jane Doe",
  "doctorId": 1,
  "doctorName": "Dr. John Smith",
  "dateTime": "2024-12-20T10:30:00",
  "duration": 30,
  "status": "CANCELLED",
  "reason": "Regular checkup",
  "notes": null,
  "createdAt": "2026-01-20T20:44:40",
  "updatedAt": "2026-01-20T20:44:40"
}
```

---

## 🩺 Consultations

### 6. Create Consultation
**POST** `/api/consultations`

**Access:** DOCTOR only

**Request Body:**
```json
{
  "appointmentId": 2,
  "symptoms": "Headache and fever",
  "diagnosis": "Common cold",
  "recommendations": "Rest and plenty of fluids"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "date": "2024-12-20",
  "symptoms": "Headache and fever",
  "diagnosis": "Common cold",
  "recommendations": "Rest and plenty of fluids",
  "appointmentId": 2,
  "patientId": 2,
  "patientName": "Jane Doe",
  "doctorId": 1,
  "doctorName": "Dr. John Smith",
  "createdAt": "2026-01-20T21:00:00",
  "updatedAt": "2026-01-20T21:00:00"
}
```

---

### 7. Get Consultations by Patient
**GET** `/api/consultations/patient/{id}`

**Access:** PATIENT, DOCTOR

**Example:** `GET /api/consultations/patient/2`

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "date": "2024-12-20",
    "symptoms": "Headache and fever",
    "diagnosis": "Common cold",
    "recommendations": "Rest and plenty of fluids",
    "appointmentId": 2,
    "patientId": 2,
    "patientName": "Jane Doe",
    "doctorId": 1,
    "doctorName": "Dr. John Smith",
    "createdAt": "2026-01-20T21:00:00",
    "updatedAt": "2026-01-20T21:00:00"
  }
]
```

---

### 8. Get Consultations by Doctor
**GET** `/api/consultations/doctor/{id}`

**Access:** PATIENT, DOCTOR

**Example:** `GET /api/consultations/doctor/1`

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "date": "2024-12-20",
    "symptoms": "Headache and fever",
    "diagnosis": "Common cold",
    "recommendations": "Rest and plenty of fluids",
    "appointmentId": 2,
    "patientId": 2,
    "patientName": "Jane Doe",
    "doctorId": 1,
    "doctorName": "Dr. John Smith",
    "createdAt": "2026-01-20T21:00:00",
    "updatedAt": "2026-01-20T21:00:00"
  }
]
```

---

## 💊 Prescriptions

### 9. Create Prescription
**POST** `/api/prescriptions`

**Access:** DOCTOR only

**Request Body:**
```json
{
  "patientId": 2,
  "expirationDate": "2025-01-20",
  "renewable": true,
  "lines": [
    {
      "medicineId": 1,
      "dosage": "500mg",
      "duration": "7 days",
      "instructions": "Take twice daily after meals"
    },
    {
      "medicineId": 2,
      "dosage": "250mg",
      "duration": "5 days",
      "instructions": "Take once daily at bedtime"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "date": "2026-01-20",
  "expirationDate": "2025-01-20",
  "renewable": true,
  "patientId": 2,
  "patientName": "Jane Doe",
  "doctorId": 1,
  "doctorName": "Dr. John Smith",
  "lines": [
    {
      "id": 1,
      "medicineId": 1,
      "medicineName": "Paracetamol 500mg",
      "dosage": "500mg",
      "duration": "7 days",
      "instructions": "Take twice daily after meals"
    },
    {
      "id": 2,
      "medicineId": 2,
      "medicineName": "Amoxicillin 250mg",
      "dosage": "250mg",
      "duration": "5 days",
      "instructions": "Take once daily at bedtime"
    }
  ],
  "createdAt": "2026-01-20T21:00:00",
  "updatedAt": "2026-01-20T21:00:00"
}
```

---

### 10. Get Prescriptions by Patient
**GET** `/api/prescriptions/patient/{id}`

**Access:** PATIENT, DOCTOR, PHARMACIST

**Example:** `GET /api/prescriptions/patient/2`

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "date": "2026-01-20",
    "expirationDate": "2025-01-20",
    "renewable": true,
    "patientId": 2,
    "patientName": "Jane Doe",
    "doctorId": 1,
    "doctorName": "Dr. John Smith",
    "lines": [...],
    "createdAt": "2026-01-20T21:00:00",
    "updatedAt": "2026-01-20T21:00:00"
  }
]
```

---

### 11. Get Prescriptions by Doctor
**GET** `/api/prescriptions/doctor/{id}`

**Access:** PATIENT, DOCTOR, PHARMACIST

**Example:** `GET /api/prescriptions/doctor/1`

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "date": "2026-01-20",
    "expirationDate": "2025-01-20",
    "renewable": true,
    "patientId": 2,
    "patientName": "Jane Doe",
    "doctorId": 1,
    "doctorName": "Dr. John Smith",
    "lines": [...],
    "createdAt": "2026-01-20T21:00:00",
    "updatedAt": "2026-01-20T21:00:00"
  }
]
```

---

### 12. Get All Prescriptions (Pharmacist)
**GET** `/api/prescriptions/pharmacist`

**Access:** PHARMACIST only

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "date": "2026-01-20",
    "expirationDate": "2025-01-20",
    "renewable": true,
    "patientId": 2,
    "patientName": "Jane Doe",
    "doctorId": 1,
    "doctorName": "Dr. John Smith",
    "lines": [...],
    "createdAt": "2026-01-20T21:00:00",
    "updatedAt": "2026-01-20T21:00:00"
  }
]
```

---

## 📋 Medical Records

### 13. Get Medical Record by Patient
**GET** `/api/medical-records/patient/{id}`

**Access:** PATIENT, DOCTOR

**Example:** `GET /api/medical-records/patient/2`

**Response (200 OK):**
```json
{
  "id": 1,
  "patientId": 2,
  "patientName": "Jane Doe",
  "allergies": "Penicillin",
  "antecedents": "No major medical history",
  "createdAt": "2026-01-20T20:00:00",
  "updatedAt": "2026-01-20T20:00:00"
}
```

---

### 14. Update Medical Record
**PUT** `/api/medical-records/{id}`

**Access:** DOCTOR only

**Example:** `PUT /api/medical-records/1`

**Request Body:**
```json
{
  "allergies": "Penicillin, Aspirin",
  "antecedents": "Diabetes type 2, High blood pressure"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "patientId": 2,
  "patientName": "Jane Doe",
  "allergies": "Penicillin, Aspirin",
  "antecedents": "Diabetes type 2, High blood pressure",
  "createdAt": "2026-01-20T20:00:00",
  "updatedAt": "2026-01-20T21:30:00"
}
```

---

## 🤖 Chatbot (Medicine Finder)

### 15. Check Medicine Availability
**POST** `/api/chatbot/check-medicine`

**Access:** DOCTOR, PATIENT

**Request Body:**
```json
{
  "medicine": "Paracetamol 500mg",
  "userLatitude": 36.8065,
  "userLongitude": 10.1815
}
```

**Response (200 OK) - Medicine Available:**
```json
{
  "available": true,
  "nearestPharmacy": {
    "name": "City Medical Pharmacy",
    "address": "123 Main Street, City",
    "distanceKm": 0.0,
    "quantity": 15
  },
  "otherPharmacies": [
    {
      "name": "Pharmacy El Amal",
      "address": "Ariana",
      "distanceKm": 3.5,
      "quantity": 5
    }
  ],
  "message": null,
  "alternatives": null
}
```

**Response (200 OK) - Medicine Not Available:**
```json
{
  "available": false,
  "nearestPharmacy": null,
  "otherPharmacies": [],
  "message": "Medicine not available in any pharmacy. We've checked all pharmacies. Your doctor has been notified.",
  "alternatives": [
    "Doliprane 500mg",
    "Efferalgan 500mg"
  ]
}
```

**Response (200 OK) - Medicine Not Found:**
```json
{
  "available": false,
  "nearestPharmacy": null,
  "otherPharmacies": [],
  "message": "Medicine not found: Unknown Medicine. Your doctor has been notified.",
  "alternatives": []
}
```

---

## 🔔 Notifications

### 16. Get Unread Notifications
**GET** `/api/notifications/unread`

**Access:** DOCTOR only

**Response (200 OK):**
```json
[
  {
    "notificationId": 1,
    "medicineName": "Unknown Medicine",
    "patientName": "Jane Doe",
    "patientId": 2,
    "message": "Patient Jane Doe requested medicine 'Unknown Medicine' which is not in our database.",
    "createdAt": "2026-01-20T21:00:00"
  }
]
```

---

### 17. Get All Notifications
**GET** `/api/notifications/all`

**Access:** DOCTOR only

**Response (200 OK):**
```json
[
  {
    "notificationId": 1,
    "medicineName": "Unknown Medicine",
    "patientName": "Jane Doe",
    "patientId": 2,
    "message": "Patient Jane Doe requested medicine 'Unknown Medicine' which is not in our database.",
    "createdAt": "2026-01-20T21:00:00"
  },
  {
    "notificationId": 2,
    "medicineName": "Paracetamol 500mg",
    "patientName": "John Patient",
    "patientId": 4,
    "message": "Patient John Patient requested medicine 'Paracetamol 500mg' which is not available in any pharmacy. All pharmacies checked.",
    "createdAt": "2026-01-20T20:30:00"
  }
]
```

---

### 18. Mark Notification as Read
**PUT** `/api/notifications/{id}/read`

**Access:** DOCTOR only

**Example:** `PUT /api/notifications/1/read`

**Response (200 OK):** Empty body

---

## 📝 Common Response Formats

### Success Responses
- **200 OK** - Successful GET/PUT request
- **201 Created** - Successful POST request

### Error Responses
- **400 Bad Request** - Invalid input or business logic error
- **401 Unauthorized** - Authentication required
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server error

### Error Response Format:
```json
{
  "error": "Error message here"
}
```

---

## 🔐 Authentication Notes

**Current Setup (Testing):**
- Method security is disabled for testing
- All endpoints are accessible without authentication
- In production, enable JWT authentication

**For Production:**
- Add JWT token to headers: `Authorization: Bearer <token>`
- Enable method security in `SecurityConfig`
- Implement authentication endpoints (login, register)

---

## 📅 Date/Time Formats

- **Date:** `YYYY-MM-DD` (e.g., "2024-12-20")
- **DateTime:** `YYYY-MM-DDTHH:mm:ss` (e.g., "2024-12-20T10:30:00")
- **LocalDateTime:** ISO 8601 format

---

## 🎯 Quick Reference

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/users` | POST | Public | Register new user |
| `/api/users/login` | POST | Public | Login user |
| `/api/users/{id}` | GET | Public | Get user by ID |
| `/api/users/email/{email}` | GET | Public | Get user by email |
| `/api/appointments` | POST | PATIENT | Create appointment |
| `/api/appointments/patient/{id}` | GET | PATIENT, DOCTOR | Get patient appointments |
| `/api/appointments/doctor/{id}` | GET | PATIENT, DOCTOR | Get doctor appointments |
| `/api/appointments/{id}/confirm` | PUT | DOCTOR | Confirm appointment |
| `/api/appointments/{id}/cancel` | PUT | PATIENT, DOCTOR | Cancel appointment |
| `/api/consultations` | POST | DOCTOR | Create consultation |
| `/api/consultations/patient/{id}` | GET | PATIENT, DOCTOR | Get patient consultations |
| `/api/consultations/doctor/{id}` | GET | PATIENT, DOCTOR | Get doctor consultations |
| `/api/prescriptions` | POST | DOCTOR | Create prescription |
| `/api/prescriptions/patient/{id}` | GET | PATIENT, DOCTOR, PHARMACIST | Get patient prescriptions |
| `/api/prescriptions/doctor/{id}` | GET | PATIENT, DOCTOR, PHARMACIST | Get doctor prescriptions |
| `/api/prescriptions/pharmacist` | GET | PHARMACIST | Get all prescriptions |
| `/api/medical-records/patient/{id}` | GET | PATIENT, DOCTOR | Get medical record |
| `/api/medical-records/{id}` | PUT | DOCTOR | Update medical record |
| `/api/chatbot/check-medicine` | POST | DOCTOR, PATIENT | Check medicine availability |
| `/api/notifications/unread` | GET | DOCTOR | Get unread notifications |
| `/api/notifications/all` | GET | DOCTOR | Get all notifications |
| `/api/notifications/{id}/read` | PUT | DOCTOR | Mark notification as read |

---

## 💡 Frontend Integration Tips

1. **Base URL:** Store `http://localhost:8081/api` as a constant
2. **Headers:** Always include `Content-Type: application/json` for POST/PUT
3. **Error Handling:** Check status codes and handle errors gracefully
4. **Loading States:** Show loading indicators during API calls
5. **Date Formatting:** Use date formatting libraries for display
6. **Distance Display:** Format `distanceKm` with units (e.g., "1.2 km")
7. **Role-Based UI:** Show/hide features based on user role
8. **Real-time Updates:** Consider WebSocket for notifications (future enhancement)

---

**Total Endpoints: 22**

All endpoints are ready for frontend integration! 🚀
