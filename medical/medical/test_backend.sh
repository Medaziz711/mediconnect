#!/bin/bash

# Quick Backend Test Script
# Run: bash test_backend.sh

BASE_URL="http://localhost:8081"

echo "🧪 Testing Medical Platform Backend"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    
    echo -n "Testing $name... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ OK ($http_code)${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED ($http_code)${NC}"
        echo "Response: $body"
        return 1
    fi
}

# Health check
echo "1. Health Check"
test_endpoint "Backend Health" "GET" "$BASE_URL/api/users/email/admin@gestion-medicale.com"
echo ""

# Authentication
echo "2. Authentication Tests"
test_endpoint "Register Patient" "POST" "$BASE_URL/api/users" '{
  "name": "Test Patient",
  "email": "testpatient@test.com",
  "password": "test123",
  "phone": "1234567890",
  "address": "123 Test St",
  "role": "PATIENT",
  "dateOfBirth": "1990-01-01",
  "bloodGroup": "O+"
}'

test_endpoint "Register Doctor" "POST" "$BASE_URL/api/users" '{
  "name": "Dr. Test",
  "email": "testdoctor@test.com",
  "password": "test123",
  "phone": "0987654321",
  "address": "456 Doctor St",
  "role": "DOCTOR",
  "specialization": "General",
  "licenseNumber": "TEST123"
}'

test_endpoint "Login" "POST" "$BASE_URL/api/users/login" '{
  "email": "admin@gestion-medicale.com",
  "password": "password"
}'
echo ""

# Admin
echo "3. Admin Tests"
test_endpoint "Get Pending Demandes" "GET" "$BASE_URL/api/admin/demandes"
echo ""

# Appointments
echo "4. Appointment Tests"
test_endpoint "Create Appointment" "POST" "$BASE_URL/api/appointments" '{
  "doctorId": 1,
  "dateTime": "2026-02-25T10:00:00",
  "duration": 30,
  "reason": "Test appointment"
}'

test_endpoint "Get Appointments by Patient" "GET" "$BASE_URL/api/appointments/patient/1"
test_endpoint "Get Appointments by Doctor" "GET" "$BASE_URL/api/appointments/doctor/1"
echo ""

# Consultations
echo "5. Consultation Tests"
test_endpoint "Create Consultation" "POST" "$BASE_URL/api/consultations" '{
  "appointmentId": 1,
  "symptoms": "Test symptoms",
  "diagnosis": "Test diagnosis",
  "recommendations": "Test recommendations"
}'

test_endpoint "Get Consultations by Patient" "GET" "$BASE_URL/api/consultations/patient/1"
test_endpoint "Get Consultations by Doctor" "GET" "$BASE_URL/api/consultations/doctor/1"
echo ""

# Chatbot
echo "6. Chatbot Tests"
test_endpoint "Check Medicine" "POST" "$BASE_URL/api/chatbot/check-medicine" '{
  "medicine": "Paracetamol",
  "userLatitude": 48.8566,
  "userLongitude": 2.3522
}'
echo ""

echo "===================================="
echo -e "${GREEN}Testing Complete!${NC}"
echo ""
echo "Note: Some tests may fail if:"
echo "  - Database doesn't have required data"
echo "  - IDs don't exist (replace with actual IDs)"
echo "  - Dates are in the past"
