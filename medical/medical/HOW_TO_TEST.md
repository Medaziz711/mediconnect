# How to test the application

## 1. Prepare the database

1. Open **MySQL** (phpMyAdmin or command line).
2. Run the script **`gestion_medicale_separate_tables.sql`** (creates DB + tables + default admin).
3. In **`application.properties`** set your MySQL user/password if needed (default: `root` / empty).

---

## 2. Start the app

From the project folder:

```bash
mvn spring-boot:run
```

Or run the main class **`MedicalPharmacyPlatformApplication`** from your IDE.

The API will be available at: **http://localhost:8081**

---

## 3. Test with Postman or curl

Base URL: **http://localhost:8081/api**

### 3.1 Admin login

- **POST** `http://localhost:8081/api/users/login`
- Body (JSON):
```json
{
  "email": "admin@gestion-medicale.com",
  "password": "password"
}
```
- Expected: `200` with user data and `"role": "ADMIN"`.

---

### 3.2 Register a patient (can use the app immediately)

- **POST** `http://localhost:8081/api/users`
- Body (JSON):
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
- Expected: `201` with user and `"statut": "actif"`.

---

### 3.3 Patient login

- **POST** `http://localhost:8081/api/users/login`
- Body:
```json
{
  "email": "patient@test.com",
  "password": "patient123"
}
```
- Expected: `200` with `"role": "PATIENT"`.

---

### 3.4 Register a doctor (pending admin approval)

- **POST** `http://localhost:8081/api/users`
- Body:
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
- Expected: `201` with `"statut": "en_attente"`.

---

### 3.5 Doctor login before approval (should fail)

- **POST** `http://localhost:8081/api/users/login`
- Body: `{"email": "doctor@test.com", "password": "doctor123"}`
- Expected: `400` with message like "pending admin approval".

---

### 3.6 Admin: list pending requests

- **GET** `http://localhost:8081/api/admin/demandes`
- Expected: `200` with a list containing the doctor’s request (id, userEmail, userName, roleDemande: "DOCTOR", statut: "en_attente").

---

### 3.7 Admin: accept the request

- **POST** `http://localhost:8081/api/admin/demandes/1/accept`
- Body: `{"adminUserId": 1}`  
  (use the `id` from the `admins` table, usually `1` for the default admin)
- Use the **demande id** from the list (e.g. `1` in the URL above).
- Expected: `200` "Demande accepted. Email sent to the user."

---

### 3.8 Doctor login after approval (should succeed)

- **POST** `http://localhost:8081/api/users/login`
- Body: `{"email": "doctor@test.com", "password": "doctor123"}`
- Expected: `200` with `"role": "DOCTOR"` and `"statut": "actif"`.

---

### 3.9 Optional: get user by email

- **GET** `http://localhost:8081/api/users/email/patient@test.com`
- Expected: `200` with that user’s data.

---

## 4. Quick checklist

| Step | Action | Expected |
|------|--------|----------|
| 1 | Run `gestion_medicale_separate_tables.sql` | DB + tables + 1 admin |
| 2 | Start app (`mvn spring-boot:run`) | Server on port 8081 |
| 3 | Admin login | 200, role ADMIN |
| 4 | Register patient | 201, statut actif |
| 5 | Patient login | 200 |
| 6 | Register doctor | 201, statut en_attente |
| 7 | Doctor login | 400 (pending) |
| 8 | GET /api/admin/demandes | 200, list with doctor request |
| 9 | POST .../demandes/1/accept | 200 |
| 10 | Doctor login again | 200, statut actif |

---

## 5. Troubleshooting

- **DB connection error:** Check MySQL is running and `application.properties` (url, username, password).
- **Table doesn’t exist:** Run the full `gestion_medicale_separate_tables.sql` again.
- **Admin not found:** Ensure the script’s `INSERT INTO admins` ran (one row with email `admin@gestion-medicale.com`).
