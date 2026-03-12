# Chatbot API Documentation

## Overview
The chatbot feature allows DOCTOR and PATIENT users to check medicine availability in nearby pharmacies with distance calculation.

---

## Endpoint

### POST `/api/chatbot/check-medicine`

**Access:** DOCTOR, PATIENT roles only

**Description:** Searches for medicine availability in pharmacies, calculates distances, and returns the nearest pharmacy. Also provides alternatives if medicine is not available.

---

## Request

### Headers
```
Content-Type: application/json
Authorization: Bearer <token> (if authentication is enabled)
```

### Request Body
```json
{
  "medicine": "Paracetamol 500mg",
  "userLatitude": 36.8065,
  "userLongitude": 10.1815
}
```

### Request Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `medicine` | String | Yes | Medicine name (exact or partial match) |
| `userLatitude` | Double | Yes | User's current latitude |
| `userLongitude` | Double | Yes | User's current longitude |

---

## Response

### Success Response (Medicine Available)

**Status Code:** 200 OK

```json
{
  "available": true,
  "nearestPharmacy": {
    "name": "City Medical Pharmacy",
    "address": "123 Main Street, City",
    "distanceKm": 1.2,
    "quantity": 15
  },
  "otherPharmacies": [
    {
      "name": "Pharmacy El Amal",
      "address": "Ariana",
      "distanceKm": 3.5,
      "quantity": 5
    },
    {
      "name": "Central Pharmacy",
      "address": "Downtown, City",
      "distanceKm": 5.8,
      "quantity": 8
    }
  ],
  "message": null,
  "alternatives": null
}
```

### Success Response (Medicine Not Available)

**Status Code:** 200 OK

```json
{
  "available": false,
  "nearestPharmacy": null,
  "otherPharmacies": [],
  "message": "Medicine not available in any pharmacy",
  "alternatives": [
    "Doliprane 500mg",
    "Efferalgan 500mg",
    "Tylenol 500mg"
  ]
}
```

### Error Response

**Status Code:** 400 Bad Request

```json
{
  "available": false,
  "nearestPharmacy": null,
  "otherPharmacies": [],
  "message": "Error occurred while checking medicine availability: <error details>",
  "alternatives": []
}
```

---

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `available` | Boolean | Whether medicine is available in any pharmacy |
| `nearestPharmacy` | PharmacyInfoDTO | The nearest pharmacy with the medicine (null if not available) |
| `otherPharmacies` | List<PharmacyInfoDTO> | Other pharmacies with the medicine, sorted by distance |
| `message` | String | Error or informational message |
| `alternatives` | List<String> | Alternative medicines with same generic name (if not available) |

### PharmacyInfoDTO Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Pharmacy name |
| `address` | String | Pharmacy address |
| `distanceKm` | Double | Distance from user location in kilometers |
| `quantity` | Integer | Available quantity at this pharmacy |

---

## How It Works

### 1. Medicine Search
- First tries exact name match (case-insensitive)
- If not found, tries partial name match
- Returns the first matching medicine

### 2. Stock Search
- Finds all pharmacies with:
  - Medicine in stock (`quantity > 0`)
  - Not expired (`expiration_date > today`)

### 3. Distance Calculation
- Uses Haversine formula to calculate great-circle distance
- Distance is in kilometers, rounded to 2 decimal places

### 4. Sorting
- Pharmacies are sorted by distance (nearest first)
- First pharmacy becomes `nearestPharmacy`
- Remaining become `otherPharmacies`

### 5. Alternatives
- If medicine not available:
  - Searches for medicines with same `generic` name
  - Excludes the original medicine
  - Returns list of alternative medicine names

---

## Example Requests

### Example 1: Check Paracetamol Availability
```bash
curl -X POST http://localhost:8081/api/chatbot/check-medicine \
  -H "Content-Type: application/json" \
  -d '{
    "medicine": "Paracetamol 500mg",
    "userLatitude": 36.8065,
    "userLongitude": 10.1815
  }'
```

### Example 2: Check Amoxicillin (Partial Name)
```bash
curl -X POST http://localhost:8081/api/chatbot/check-medicine \
  -H "Content-Type: application/json" \
  -d '{
    "medicine": "Amoxicillin",
    "userLatitude": 40.7128,
    "userLongitude": -74.0060
  }'
```

### Example 3: Check Non-Existent Medicine
```bash
curl -X POST http://localhost:8081/api/chatbot/check-medicine \
  -H "Content-Type: application/json" \
  -d '{
    "medicine": "Unknown Medicine",
    "userLatitude": 36.8065,
    "userLongitude": 10.1815
  }'
```

---

## Testing with Postman

1. **URL:** `http://localhost:8081/api/chatbot/check-medicine`
2. **Method:** `POST`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body (raw JSON):**
```json
{
  "medicine": "Paracetamol 500mg",
  "userLatitude": 36.8065,
  "userLongitude": 10.1815
}
```

---

## Important Notes

1. **Distance Calculation:** Uses Haversine formula for accurate great-circle distance
2. **Expiration Check:** Only shows medicines that haven't expired
3. **Case Insensitive:** Medicine name search is case-insensitive
4. **Partial Match:** Supports partial medicine name matching
5. **Alternatives:** Only shown when medicine is not available anywhere
6. **Role Access:** Only DOCTOR and PATIENT can access this endpoint

---

## Database Requirements

1. **Medicines table** must have:
   - `name` (for search)
   - `generic` (for alternatives)

2. **Pharmacies table** must have:
   - `latitude`
   - `longitude`

3. **stock_medicines table** must have:
   - `pharmacy_id`
   - `medicine_id`
   - `quantity`
   - `expiration_date`

---

## Future Enhancements

- Add pharmacy operating hours check
- Filter by minimum quantity threshold
- Add pharmacy contact information
- Support multiple medicine searches at once
- Cache distance calculations
- Add pharmacy ratings/reviews
