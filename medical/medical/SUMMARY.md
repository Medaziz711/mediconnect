# Gestion Médicale – Project Summary

## What it is

A **Spring Boot 3** REST API for a medical management system.  
Database: **MySQL** – one database **gestion_medicale** with **separate tables** for each role (no single “users” table).

---

## Database (gestion_medicale)

**Script:** `gestion_medicale_separate_tables.sql`

### Role tables (each with its own login fields)

| Table        | Role       | Notes                                      |
|-------------|------------|--------------------------------------------|
| **admins**  | Admin      | Default: admin@gestion-medicale.com / password |
| **patients**| Patient    | Can self-register → account active immediately |
| **medecins**| Doctor     | Register as request → admin must accept    |
| **pharmaciens** | Pharmacist | Same as doctor (request → admin accepts)   |

### Other main tables

- **pharmacies** – linked to pharmacien  
- **dossiers_medicaux** – medical file per patient  
- **rendez_vous** – appointments (patient + medecin)  
- **consultations** – linked to rendez_vous + dossier_medical  
- **ordonnances** – prescriptions (linked to consultation)  
- **medicaments**, **ligne_ordonnances** – drugs and prescription lines  
- **stock_medicaments** – stock per pharmacy  
- **paiements** – payments  
- **demandes_inscription** – doctor/pharmacist registration requests (admin accepts/rejects)  
- **notifications** – in-app notifications  
- **medicine_request_notifications** – medicine-request alerts for doctors  

---

## Auth & registration rules

- **Admin:** Logs in with email/password. Cannot self-register (created via SQL or by another admin).
- **Patient:** Registers via API → account is **actif** → can log in immediately.
- **Doctor / Pharmacist:** Register via API → account stays **en_attente** → **admin** accepts or rejects via `/api/admin/demandes` → then (optional) email notification; when accepted, statut becomes **actif** and they can log in.

---

## Main API endpoints

| Action              | Method | URL                              |
|---------------------|--------|----------------------------------|
| Login               | POST   | `/api/users/login`               |
| Register            | POST   | `/api/users`                     |
| Get user by email   | GET    | `/api/users/email/{email}`      |
| List pending requests | GET  | `/api/admin/demandes`            |
| Accept request      | POST   | `/api/admin/demandes/{id}/accept` |
| Reject request      | POST   | `/api/admin/demandes/{id}/reject`  |
| Create appointment  | POST   | `/api/appointments`              |
| List appointments   | GET    | `/api/appointments/patient/{id}` or `/doctor/{id}` |
| Consultations       | POST/GET | `/api/consultations`           |
| Medical records     | GET    | `/api/medical-records/patient/{id}` |
| Prescriptions       | POST/GET | `/api/prescriptions`           |
| Chatbot (medicine availability) | POST | `/api/chatbot/check-medicine` |
| Doctor notifications | GET  | `/api/notifications`            |

Base URL: **http://localhost:8081**

---

## Tech stack

- **Java 17**, **Spring Boot 3.2**
- **Spring Web** (REST), **Spring Data JPA**, **Spring Security**
- **MySQL** – database `gestion_medicale`
- **Maven** – build

---

## How to run

1. **MySQL:** Run `gestion_medicale_separate_tables.sql` (creates DB + tables + default admin).
2. **Config:** In `application.properties` set `spring.datasource.username` and `spring.datasource.password` if needed.
3. **Start:** `mvn spring-boot:run` (app listens on port **8081**).
4. **Test:** Postman – e.g. POST `http://localhost:8081/api/users/login` with `{"email":"admin@gestion-medicale.com","password":"password"}`.

---

## Default admin

- **Email:** admin@gestion-medicale.com  
- **Password:** password  
(Change after first login in a real environment.)
