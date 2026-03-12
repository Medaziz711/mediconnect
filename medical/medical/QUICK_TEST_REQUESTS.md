# Quick Backend Test Requests

Copy and paste these requests to test your backend. Base URL: `http://localhost:8081`

---

## 🔐 1. Authentication Tests

### Register a Patient
```bash
curl -X POST http://localhost:8081/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Patient",
    "email": "patient1@test.com",
    "password": "password123",
    "phone": "1234567890",
    "address": "123 Main St",
    "role": "PATIENT",
    "dateOfBirth": "1990-05-15",
    "bloodGroup": "O+"
  }'
```

**Expected:** `201 Created` with user object

---

### Register a Doctor (Pending Approval)
```bash
curl -X POST http://localhost:8081/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Jane Smith",
    "email": "doctor1@test.com",
    "password": "password123",
    "phone": "0987654321",
    "address": "456 Medical St",
    "role": "DOCTOR",
    "specialization": "Cardiology",
    "licenseNumber": "DOC12345"
  }'
```

**Expected:** `201 Created` with `statut: "en_attente"`

---

### Login (Use default admin or registered user)
```bash
curl -X POST http://localhost:8081/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@gestion-medicale.com",
    "password": "password"
  }'
```

**Expected:** `200 OK` with user object

---

### Get User by Email
```bash
curl http://localhost:8081/api/users/email/admin@gestion-medicale.com
```

**Expected:** `200 OK` with user object

---

### Get User by ID
```bash
curl http://localhost:8081/api/users/1
```

**Expected:** `200 OK` with user object

---

## 👨‍💼 2. Admin Tests

### Get All Pending Registration Requests
```bash
curl http://localhost:8081/api/admin/demandes
```

**Expected:** `200 OK` with array of pending requests

---

### Accept a Registration Request
```bash
curl -X POST http://localhost:8081/api/admin/demandes/1/accept \
  -H "Content-Type: application/json" \
  -d '{
    "adminUserId": 1
  }'
```

**Expected:** `200 OK` with "Demande accepted" message

---

### Reject a Registration Request
```bash
curl -X POST http://localhost:8081/api/admin/demandes/1/reject \
  -H "Content-Type: application/json" \
  -d '{
    "adminUserId": 1,
    "motifRejet": "Incomplete documents"
  }'
```

**Expected:** `200 OK` with "Demande rejected" message

---

## 📅 3. Appointment Tests

### Create Appointment (as Patient)
```bash
curl -X POST http://localhost:8081/api/appointments \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": 1,
    "dateTime": "2026-02-20T10:30:00",
    "duration": 30,
    "reason": "Regular checkup"
  }'
```

**Expected:** `201 Created` with appointment object

---

### Get Appointments by Patient ID
```bash
curl http://localhost:8081/api/appointments/patient/1
```

**Expected:** `200 OK` with array of appointments

---

### Get Appointments by Doctor ID
```bash
curl http://localhost:8081/api/appointments/doctor/1
```

**Expected:** `200 OK` with array of appointments

---

### Confirm Appointment (as Doctor)
```bash
curl -X PUT http://localhost:8081/api/appointments/1/confirm
```

**Expected:** `200 OK` with appointment status `CONFIRMED`

---

### Cancel Appointment
```bash
curl -X PUT http://localhost:8081/api/appointments/1/cancel
```

**Expected:** `200 OK` with appointment status `CANCELLED`

---

## 🏥 4. Consultation Tests

### Create Consultation (as Doctor)
```bash
curl -X POST http://localhost:8081/api/consultations \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": 1,
    "symptoms": "Headache and fever",
    "diagnosis": "Common cold",
    "recommendations": "Rest and hydration"
  }'
```

**Expected:** `201 Created` with consultation object

---

### Get Consultations by Patient ID
```bash
curl http://localhost:8081/api/consultations/patient/1
```

**Expected:** `200 OK` with array of consultations

---

### Get Consultations by Doctor ID
```bash
curl http://localhost:8081/api/consultations/doctor/1
```

**Expected:** `200 OK` with array of consultations

---

## 🤖 5. Chatbot Tests

### Check Medicine Availability
```bash
curl -X POST http://localhost:8081/api/chatbot/check-medicine \
  -H "Content-Type: application/json" \
  -d '{
    "medicine": "Paracetamol",
    "userLatitude": 48.8566,
    "userLongitude": 2.3522
  }'
```

**Expected:** `200 OK` or `400 Bad Request` with availability info

---

## 📋 Complete Test Sequence

Run these in order to test the full flow:

```bash
# 1. Register a patient
curl -X POST http://localhost:8081/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Patient","email":"testpatient@test.com","password":"test123","phone":"123456","address":"Test St","role":"PATIENT","dateOfBirth":"1990-01-01","bloodGroup":"A+"}'

# 2. Register a doctor
curl -X POST http://localhost:8081/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Dr. Test","email":"testdoctor@test.com","password":"test123","phone":"654321","address":"Doctor St","role":"DOCTOR","specialization":"General","licenseNumber":"TEST123"}'

# 3. Login as admin
curl -X POST http://localhost:8081/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gestion-medicale.com","password":"password"}'

# 4. Get pending requests
curl http://localhost:8081/api/admin/demandes

# 5. Accept doctor request (replace 1 with actual ID from step 4)
curl -X POST http://localhost:8081/api/admin/demandes/1/accept \
  -H "Content-Type: application/json" \
  -d '{"adminUserId":1}'

# 6. Create appointment (replace doctorId with actual doctor ID)
curl -X POST http://localhost:8081/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"doctorId":1,"dateTime":"2026-02-25T10:00:00","duration":30,"reason":"Test"}'

# 7. Get appointments
curl http://localhost:8081/api/appointments/patient/1

# 8. Create consultation (replace appointmentId with actual ID from step 6)
curl -X POST http://localhost:8081/api/consultations \
  -H "Content-Type: application/json" \
  -d '{"appointmentId":1,"symptoms":"Test","diagnosis":"Test","recommendations":"Test"}'

# 9. Get consultations
curl http://localhost:8081/api/consultations/patient/1
```

---

## ✅ Quick Health Check

Test if your backend is running:

```bash
curl http://localhost:8081/api/users/email/admin@gestion-medicale.com
```

If you get a response (even if it's an error), your backend is running! ✅

---

## 🐛 Common Issues

**Connection Refused?**
- Make sure Spring Boot is running: `mvn spring-boot:run`
- Check port 8081 is not blocked

**404 Not Found?**
- Verify endpoint URL matches exactly
- Check base URL is `http://localhost:8081`

**500 Internal Server Error?**
- Check database connection (see `TROUBLESHOOTING_DATABASE.md`)
- Check application logs for errors

**400 Bad Request?**
- Verify JSON format is correct
- Check required fields are present
- Check data types match (dates, numbers, etc.)

---

## 💡 Tips

1. **Use Postman** - Import the collection file for easier testing
2. **Check IDs** - Replace placeholder IDs (1, 2) with actual IDs from your database
3. **Check Dates** - Use future dates for appointments: `2026-02-25T10:00:00`
4. **View Logs** - Check Spring Boot console for detailed error messages

---

**Happy Testing! 🚀**
