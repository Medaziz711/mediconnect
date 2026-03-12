# Postman – Test requests

Base URL: **http://localhost:8081/api**

For every **POST** request:  
- **Headers:** `Content-Type` = `application/json`

---

## 1. Admin login

- **Method:** POST  
- **URL:** `http://localhost:8081/api/users/login`  
- **Body (raw, JSON):**
```json
{
  "email": "admin@gestion-medicale.com",
  "password": "password"
}
```

---

## 2. Register patient

- **Method:** POST  
- **URL:** `http://localhost:8081/api/users`  
- **Body (raw, JSON):**
```json
{
  "name": "Jean Dupont",
  "email": "patient@test.com",
  "password": "patient123",
  "phone": "0612345678",
  "address": "Paris",
  "role": "PATIENT",
  "dateOfBirth": "1990-05-15",
  "bloodGroup": "A+",
  "medicalHistory": "None"
}
```

---

## 3. Patient login

- **Method:** POST  
- **URL:** `http://localhost:8081/api/users/login`  
- **Body (raw, JSON):**
```json
{
  "email": "patient@test.com",
  "password": "patient123"
}
```

---

## 4. Register doctor (pending approval)

- **Method:** POST  
- **URL:** `http://localhost:8081/api/users`  
- **Body (raw, JSON):**
```json
{
  "name": "Dr Martin",
  "email": "doctor@test.com",
  "password": "doctor123",
  "phone": "0698765432",
  "address": "Lyon",
  "role": "DOCTOR",
  "specialization": "General",
  "licenseNumber": "ORDRE-12345"
}
```

---

## 5. Doctor login (before approval – should fail)

- **Method:** POST  
- **URL:** `http://localhost:8081/api/users/login`  
- **Body (raw, JSON):**
```json
{
  "email": "doctor@test.com",
  "password": "doctor123"
}
```
Expected: 400, message like "pending admin approval".

---

## 6. List pending requests (admin)

- **Method:** GET  
- **URL:** `http://localhost:8081/api/admin/demandes`  
- **Body:** none  

Use the `id` of a demande from the response for the next request.

---

## 7. Accept a request (admin)

- **Method:** POST  
- **URL:** `http://localhost:8081/api/admin/demandes/1/accept`  
  (replace `1` with the real demande `id` from step 6)  
- **Body (raw, JSON):**
```json
{
  "adminUserId": 1
}
```

---

## 8. Doctor login (after approval – should succeed)

- **Method:** POST  
- **URL:** `http://localhost:8081/api/users/login`  
- **Body (raw, JSON):**
```json
{
  "email": "doctor@test.com",
  "password": "doctor123"
}
```

---

## 9. Register pharmacist (pending)

- **Method:** POST  
- **URL:** `http://localhost:8081/api/users`  
- **Body (raw, JSON):**
```json
{
  "name": "Marie Pharmacie",
  "email": "pharmacist@test.com",
  "password": "pharma123",
  "phone": "0611223344",
  "address": "Marseille",
  "role": "PHARMACIST",
  "licenseNumber": "ORDRE-PHARMA-99"
}
```

---

## 10. Get user by email

- **Method:** GET  
- **URL:** `http://localhost:8081/api/users/email/patient@test.com`  
- **Body:** none  

---

## 11. Reject a request (admin)

- **Method:** POST  
- **URL:** `http://localhost:8081/api/admin/demandes/2/reject`  
  (replace `2` with the demande `id`)  
- **Body (raw, JSON):**
```json
{
  "adminUserId": 1,
  "motifRejet": "Documents incomplets"
}
```

---

## Quick copy-paste (Body only)

**Login (admin):**
```json
{"email": "admin@gestion-medicale.com", "password": "password"}
```

**Login (patient):**
```json
{"email": "patient@test.com", "password": "patient123"}
```

**Login (doctor):**
```json
{"email": "doctor@test.com", "password": "doctor123"}
```

**Accept demande:**
```json
{"adminUserId": 1}
```

**Reject demande:**
```json
{"adminUserId": 1, "motifRejet": "Reason here"}
```
