# Simple Backend Testing Guide

## 🎯 What is curl?

**curl** is a command-line tool that sends HTTP requests. But you don't need to use it! Here are **easier ways** to test your backend:

---

## ✅ Method 1: Use Postman (EASIEST!)

1. **Download Postman** (if you don't have it): https://www.postman.com/downloads/
2. **Import the collection**:
   - Open Postman
   - Click **Import** button (top left)
   - Select file: `Medical_Platform_API.postman_collection.json`
   - Click **Import**
3. **Click Send** on any request!

**That's it!** All requests are ready to use. ✅

---

## ✅ Method 2: Use Your Browser (GET requests only)

Just open these URLs in your browser:

### Test if backend is running:
```
http://localhost:8081/api/users/email/admin@gestion-medicale.com
```

### Get pending requests:
```
http://localhost:8081/api/admin/demandes
```

### Get user by ID:
```
http://localhost:8081/api/users/1
```

**Note:** Browser only works for GET requests. For POST requests, use Postman or PowerShell.

---

## ✅ Method 3: Use PowerShell (Windows - Built-in!)

### Quick Test Script:
1. **Right-click** on `test_backend_powershell.ps1`
2. Select **"Run with PowerShell"**
3. Watch it test everything automatically!

### Or run individual tests:

**Test 1: Health Check**
```powershell
Invoke-RestMethod -Uri "http://localhost:8081/api/users/email/admin@gestion-medicale.com" -Method Get
```

**Test 2: Register Patient**
```powershell
$body = '{"name":"Test Patient","email":"test@test.com","password":"test123","phone":"123","address":"123 St","role":"PATIENT","dateOfBirth":"1990-01-01","bloodGroup":"O+"}'
Invoke-RestMethod -Uri "http://localhost:8081/api/users" -Method Post -Body $body -ContentType "application/json"
```

**Test 3: Login**
```powershell
$body = '{"email":"admin@gestion-medicale.com","password":"password"}'
Invoke-RestMethod -Uri "http://localhost:8081/api/users/login" -Method Post -Body $body -ContentType "application/json"
```

---

## ✅ Method 4: Use Online Tools

### Option A: ReqBin
1. Go to: https://reqbin.com/
2. Enter URL: `http://localhost:8081/api/users/email/admin@gestion-medicale.com`
3. Click **Send**

### Option B: HTTPie Online
1. Go to: https://httpie.io/app
2. Enter your request
3. Click **Send**

---

## 🎯 Recommended: Use Postman!

**Why Postman?**
- ✅ Visual interface (no coding needed)
- ✅ All requests ready to use
- ✅ Shows responses clearly
- ✅ Can save and organize requests
- ✅ Works for GET, POST, PUT, DELETE

**Steps:**
1. Import `Medical_Platform_API.postman_collection.json`
2. Click any request
3. Click **Send**
4. See the result!

---

## 📋 Quick Checklist

- [ ] Backend is running (`mvn spring-boot:run`)
- [ ] Database is connected
- [ ] Import Postman collection
- [ ] Test health check first
- [ ] Test other endpoints

---

## 🐛 Troubleshooting

**"Connection Refused"**
- Make sure Spring Boot is running
- Check port 8081 is correct

**"404 Not Found"**
- Check URL is correct: `http://localhost:8081/api/...`
- Make sure endpoint exists

**"500 Internal Server Error"**
- Check database connection
- Look at Spring Boot console for errors

---

## 💡 Which Method Should I Use?

| Method | Best For | Difficulty |
|--------|----------|------------|
| **Postman** | Everything | ⭐ Easy |
| **Browser** | Quick GET tests | ⭐ Very Easy |
| **PowerShell** | Windows users | ⭐⭐ Medium |
| **curl** | Linux/Mac users | ⭐⭐ Medium |

**Recommendation:** Use **Postman** - it's the easiest! 🎯

---

**Need help?** Check `POSTMAN_TESTING_GUIDE.md` for detailed Postman instructions!
