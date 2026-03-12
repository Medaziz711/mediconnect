# Postman Testing Guide

## 🚀 Quick Start

1. **Import Collection**: Import `Medical_Platform_API.postman_collection.json` into Postman
2. **Set Base URL**: The collection uses `{{baseUrl}}` variable set to `http://localhost:8081`
3. **Start Testing**: All requests are ready to use!

---

## 📋 Collection Structure

### 1. Authentication
- **Register Patient** - Create a new patient account
- **Register Doctor** - Create a doctor account (pending approval)
- **Login** - Login with email/password
- **Get User by Email** - Retrieve user by email
- **Get User by ID** - Retrieve user by ID

### 2. Admin
- **Get Pending Demandes** - List all pending registration requests
- **Accept Demande** - Accept a registration request
- **Reject Demande** - Reject a registration request

### 3. Appointments
- **Create Appointment** - Create a new appointment
- **Get Appointments by Patient** - List patient's appointments
- **Get Appointments by Doctor** - List doctor's appointments
- **Confirm Appointment** - Doctor confirms an appointment
- **Cancel Appointment** - Cancel an appointment

### 4. Consultations
- **Create Consultation** - Create a consultation record
- **Get Consultations by Patient** - List patient's consultations
- **Get Consultations by Doctor** - List doctor's consultations

### 5. Chatbot
- **Check Medicine Availability** - Check if medicine is available in nearby pharmacies

---

## 🧪 Test Examples

### Example 1: Register and Login Flow

1. **Register Patient**
   ```
   POST http://localhost:8081/api/users
   Body:
   {
     "name": "John Patient",
     "email": "john@test.com",
     "password": "password123",
     "phone": "1234567890",
     "address": "123 Main St",
     "role": "PATIENT",
     "dateOfBirth": "1990-05-15",
     "bloodGroup": "O+"
   }
   ```
   Expected: `201 Created` with user object

2. **Login**
   ```
   POST http://localhost:8081/api/users/login
   Body:
   {
     "email": "john@test.com",
     "password": "password123"
   }
   ```
   Expected: `200 OK` with user object

---

### Example 2: Doctor Registration and Approval Flow

1. **Register Doctor**
   ```
   POST http://localhost:8081/api/users
   Body:
   {
     "name": "Dr. Jane Smith",
     "email": "doctor@test.com",
     "password": "password123",
     "phone": "0987654321",
     "address": "456 Medical St",
     "role": "DOCTOR",
     "specialization": "Cardiology",
     "licenseNumber": "DOC12345"
   }
   ```
   Expected: `201 Created` with `statut: "en_attente"`

2. **Get Pending Demandes** (as Admin)
   ```
   GET http://localhost:8081/api/admin/demandes
   ```
   Expected: `200 OK` with array of pending requests

3. **Accept Demande**
   ```
   POST http://localhost:8081/api/admin/demandes/1/accept
   Body:
   {
     "adminUserId": 1
   }
   ```
   Expected: `200 OK` with success message

---

### Example 3: Appointment Flow

1. **Create Appointment** (as Patient)
   ```
   POST http://localhost:8081/api/appointments
   Body:
   {
     "doctorId": 1,
     "dateTime": "2026-02-20T10:30:00",
     "duration": 30,
     "reason": "Regular checkup"
   }
   ```
   Expected: `201 Created` with appointment object

2. **Get Appointments by Patient**
   ```
   GET http://localhost:8081/api/appointments/patient/1
   ```
   Expected: `200 OK` with array of appointments

3. **Confirm Appointment** (as Doctor)
   ```
   PUT http://localhost:8081/api/appointments/1/confirm
   ```
   Expected: `200 OK` with appointment status `CONFIRMED`

---

### Example 4: Consultation Flow

1. **Create Consultation** (as Doctor, after appointment)
   ```
   POST http://localhost:8081/api/consultations
   Body:
   {
     "appointmentId": 1,
     "symptoms": "Headache and fever",
     "diagnosis": "Common cold",
     "recommendations": "Rest and hydration"
   }
   ```
   Expected: `201 Created` with consultation object

2. **Get Consultations by Patient**
   ```
   GET http://localhost:8081/api/consultations/patient/1
   ```
   Expected: `200 OK` with array of consultations

---

### Example 5: Chatbot Medicine Check

```
POST http://localhost:8081/api/chatbot/check-medicine
Body:
{
  "medicine": "Paracetamol",
  "userLatitude": 48.8566,
  "userLongitude": 2.3522
}
```
Expected: `200 OK` with availability information

---

## 🔍 Test Scripts

All requests include **automatic test scripts** that verify:
- ✅ Status codes (200, 201, 400, etc.)
- ✅ Response structure (has required fields)
- ✅ Data validation (role, status, etc.)

View test results in Postman's **Test Results** tab after sending requests.

---

## 📝 Notes

1. **Base URL**: Default is `http://localhost:8081`. Change `{{baseUrl}}` variable if your server runs on a different port.

2. **Security**: Currently, all endpoints are public (no authentication required) due to `SecurityConfig` settings.

3. **IDs**: Replace placeholder IDs (like `1`, `2`) with actual IDs from your database.

4. **Dates**: Use ISO 8601 format: `YYYY-MM-DDTHH:mm:ss` (e.g., `2026-02-20T10:30:00`)

5. **Error Handling**: All endpoints return `400 Bad Request` with error message on failure.

---

## 🐛 Troubleshooting

### Common Issues:

1. **Connection Refused**
   - Make sure Spring Boot app is running on port 8081
   - Check `application.properties` for `server.port=8081`

2. **Database Error**
   - Ensure MySQL is running
   - Database `gestion_medicale` exists
   - Check `application.properties` for correct DB credentials

3. **404 Not Found**
   - Verify endpoint URL matches controller `@RequestMapping`
   - Check base URL variable is correct

4. **400 Bad Request**
   - Check request body format (JSON)
   - Verify required fields are present
   - Check data types match DTO requirements

---

## 📚 Additional Resources

- See `API_ENDPOINTS_COMPLETE.md` for detailed endpoint documentation
- See `HOW_TO_TEST.md` for manual testing instructions
- See `TROUBLESHOOTING_DATABASE.md` for database connection issues

---

## ✅ Test Checklist

- [ ] Import Postman collection
- [ ] Set base URL variable
- [ ] Test user registration (PATIENT)
- [ ] Test user registration (DOCTOR)
- [ ] Test login
- [ ] Test admin endpoints (get/accept/reject demandes)
- [ ] Test appointment creation
- [ ] Test appointment confirmation/cancellation
- [ ] Test consultation creation
- [ ] Test chatbot medicine check

---

**Happy Testing! 🎉**
