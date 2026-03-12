@echo off
REM Quick Backend Test Script for Windows
REM Run: test_backend.bat

set BASE_URL=http://localhost:8081

echo Testing Medical Platform Backend
echo ====================================
echo.

echo 1. Health Check
curl -s -o nul -w "Status: %%{http_code}\n" %BASE_URL%/api/users/email/admin@gestion-medicale.com
echo.

echo 2. Register Patient
curl -X POST %BASE_URL%/api/users ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test Patient\",\"email\":\"testpatient@test.com\",\"password\":\"test123\",\"phone\":\"1234567890\",\"address\":\"123 Test St\",\"role\":\"PATIENT\",\"dateOfBirth\":\"1990-01-01\",\"bloodGroup\":\"O+\"}"
echo.
echo.

echo 3. Register Doctor
curl -X POST %BASE_URL%/api/users ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Dr. Test\",\"email\":\"testdoctor@test.com\",\"password\":\"test123\",\"phone\":\"0987654321\",\"address\":\"456 Doctor St\",\"role\":\"DOCTOR\",\"specialization\":\"General\",\"licenseNumber\":\"TEST123\"}"
echo.
echo.

echo 4. Login
curl -X POST %BASE_URL%/api/users/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@gestion-medicale.com\",\"password\":\"password\"}"
echo.
echo.

echo 5. Get Pending Demandes
curl %BASE_URL%/api/admin/demandes
echo.
echo.

echo 6. Create Appointment
curl -X POST %BASE_URL%/api/appointments ^
  -H "Content-Type: application/json" ^
  -d "{\"doctorId\":1,\"dateTime\":\"2026-02-25T10:00:00\",\"duration\":30,\"reason\":\"Test appointment\"}"
echo.
echo.

echo 7. Get Appointments by Patient
curl %BASE_URL%/api/appointments/patient/1
echo.
echo.

echo 8. Create Consultation
curl -X POST %BASE_URL%/api/consultations ^
  -H "Content-Type: application/json" ^
  -d "{\"appointmentId\":1,\"symptoms\":\"Test\",\"diagnosis\":\"Test\",\"recommendations\":\"Test\"}"
echo.
echo.

echo 9. Check Medicine
curl -X POST %BASE_URL%/api/chatbot/check-medicine ^
  -H "Content-Type: application/json" ^
  -d "{\"medicine\":\"Paracetamol\",\"userLatitude\":48.8566,\"userLongitude\":2.3522}"
echo.
echo.

echo ====================================
echo Testing Complete!
echo.
pause
