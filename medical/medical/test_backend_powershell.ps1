# PowerShell Script to Test Backend
# Right-click and "Run with PowerShell" or run: powershell -ExecutionPolicy Bypass -File test_backend_powershell.ps1

$baseUrl = "http://localhost:8081"

Write-Host "🧪 Testing Medical Platform Backend" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/users/email/admin@gestion-medicale.com" -Method Get
    Write-Host "✓ Backend is running!" -ForegroundColor Green
    Write-Host "  User found: $($response.email)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Backend might not be running or user not found" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Register Patient
Write-Host "2. Testing Register Patient..." -ForegroundColor Yellow
try {
    $body = @{
        name = "Test Patient"
        email = "testpatient@test.com"
        password = "test123"
        phone = "1234567890"
        address = "123 Test St"
        role = "PATIENT"
        dateOfBirth = "1990-01-01"
        bloodGroup = "O+"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✓ Patient registered!" -ForegroundColor Green
    Write-Host "  User ID: $($response.user.id)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Registration failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Login
Write-Host "3. Testing Login..." -ForegroundColor Yellow
try {
    $body = @{
        email = "admin@gestion-medicale.com"
        password = "password"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/users/login" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "  User: $($response.user.name) - Role: $($response.user.role)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Login failed" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Get Pending Demandes
Write-Host "4. Testing Get Pending Demandes..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/admin/demandes" -Method Get
    Write-Host "✓ Got pending requests!" -ForegroundColor Green
    Write-Host "  Count: $($response.Count)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to get demandes" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Create Appointment
Write-Host "5. Testing Create Appointment..." -ForegroundColor Yellow
try {
    $body = @{
        doctorId = 1
        dateTime = "2026-02-25T10:00:00"
        duration = 30
        reason = "Test appointment"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/appointments" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✓ Appointment created!" -ForegroundColor Green
    Write-Host "  Appointment ID: $($response.id)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to create appointment" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Get Appointments
Write-Host "6. Testing Get Appointments..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/appointments/patient/1" -Method Get
    Write-Host "✓ Got appointments!" -ForegroundColor Green
    Write-Host "  Count: $($response.Count)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to get appointments" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "✅ Testing Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Some tests may fail if:" -ForegroundColor Yellow
Write-Host "  - Database doesn't have required data" -ForegroundColor Gray
Write-Host "  - IDs don't exist (replace with actual IDs)" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
