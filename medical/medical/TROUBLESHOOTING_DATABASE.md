# Database Connection Troubleshooting Guide

## Error: "Could not open JPA EntityManager for transaction"

This error means Spring Boot cannot connect to your MySQL database. Follow these steps:

---

## Step 1: Check if MySQL Server is Running

### Windows:
1. Open **Services** (Win+R → `services.msc`)
2. Look for **MySQL** or **MySQL80** service
3. Make sure it's **Running**. If not, right-click → **Start**

### Or check via Command Prompt:
```cmd
mysql -u root -p
```
- If it connects → MySQL is running ✅
- If you get "Can't connect to MySQL server" → MySQL is NOT running ❌

---

## Step 2: Verify Database Exists

1. Open **phpMyAdmin** or MySQL command line
2. Check if database `gestion_medicale` exists:
   ```sql
   SHOW DATABASES;
   ```
3. If `gestion_medicale` is NOT in the list:
   - Run the SQL script: `gestion_medicale_separate_tables.sql`
   - Or create it manually:
     ```sql
     CREATE DATABASE gestion_medicale;
     USE gestion_medicale;
     -- Then run the SQL script
     ```

---

## Step 3: Check MySQL Username and Password

In `application.properties`:
```properties
spring.datasource.username=root
spring.datasource.password=
```

**IMPORTANT:** 
- If your MySQL root password is NOT empty, update `spring.datasource.password=YOUR_PASSWORD`
- Test the connection manually:
  ```cmd
  mysql -u root -p
  ```
  Enter your password. If it works, use that same password in `application.properties`.

---

## Step 4: Verify MySQL Port

Default MySQL port is **3306**. If your MySQL uses a different port:
- Update in `application.properties`:
  ```properties
  spring.datasource.url=jdbc:mysql://localhost:YOUR_PORT/gestion_medicale?...
  ```

---

## Step 5: Test Connection Manually

Try connecting to MySQL with the exact credentials from `application.properties`:
```cmd
mysql -u root -p gestion_medicale
```
(Leave password empty if `application.properties` has empty password)

If this fails, fix the credentials first before running Spring Boot.

---

## Step 6: Check Application Logs

When you start Spring Boot, look for these error messages:

1. **"Communications link failure"** → MySQL server not running
2. **"Unknown database 'gestion_medicale'"** → Database doesn't exist
3. **"Access denied for user 'root'@'localhost'"** → Wrong password
4. **"Connection refused"** → MySQL not running or wrong port

---

## Quick Fix Checklist

- [ ] MySQL service is **Running**
- [ ] Database `gestion_medicale` **exists**
- [ ] Username/password in `application.properties` match your MySQL credentials
- [ ] MySQL port is **3306** (or updated in config)
- [ ] You can connect manually: `mysql -u root -p gestion_medicale`

---

## Still Not Working?

1. **Check MySQL error logs** (usually in MySQL data directory)
2. **Try connecting with MySQL Workbench** or phpMyAdmin first
3. **Restart MySQL service** and Spring Boot application
4. **Check firewall** - make sure port 3306 is not blocked

---

## Common Solutions

### Solution 1: Database doesn't exist
```sql
CREATE DATABASE gestion_medicale CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Then run `gestion_medicale_separate_tables.sql`

### Solution 2: Wrong password
Update `application.properties`:
```properties
spring.datasource.password=your_actual_password
```

### Solution 3: MySQL not running
Start MySQL service from Windows Services or:
```cmd
net start MySQL80
```
(Service name may vary: MySQL, MySQL80, MySQL57, etc.)
