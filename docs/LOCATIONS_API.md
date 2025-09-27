# Locations API Documentation

## Overview
This API provides access to geographical location data including countries, states/provinces, and cities. All endpoints are publicly accessible and do not require authentication.

## Base URL
```
http://localhost:4500/api/locations
```

## Endpoints

### 1. Get All Countries
**GET** `/countries`

Returns a list of all available countries with their details.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Afghanistan",
      "iso3": "AFG",
      "iso2": "AF",
      "phone_code": "93",
      "capital": "Kabul",
      "currency": "AFN",
      "currency_symbol": "؋",
      "tld": ".af",
      "native": "افغانستان",
      "region": "Asia",
      "subregion": "Southern Asia",
      "latitude": "33.00000000",
      "longitude": "65.00000000",
      "emoji": "🇦🇫",
      "emojiU": "U+1F1E6 U+1F1EB"
    }
  ],
  "total": 250
}
```

### 2. Get States by Country
**GET** `/states/:countryId`

Returns all states/provinces for a specific country.

**Parameters:**
- `countryId` (number, required): The ID of the country

**Example:**
```bash
curl -X GET "http://localhost:4500/api/locations/states/1"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3901,
      "name": "Badakhshan",
      "state_code": "BDS",
      "latitude": "36.73477250",
      "longitude": "70.81199530"
    }
  ],
  "total": 33,
  "countryId": 1
}
```

**Error Response (Country not found):**
```json
{
  "success": false,
  "message": "Country with ID 99999 not found"
}
```

### 3. Get Cities by State
**GET** `/cities/:stateId`

Returns all cities for a specific state/province.

**Parameters:**
- `stateId` (number, required): The ID of the state

**Example:**
```bash
curl -X GET "http://localhost:4500/api/locations/cities/3901"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 52,
      "name": "Ashkāsham",
      "latitude": "36.68333000",
      "longitude": "71.53333000"
    }
  ],
  "total": 6,
  "stateId": 3901
}
```

**Error Response (State not found):**
```json
{
  "success": false,
  "message": "State with ID 99999 not found"
}
```

## Error Handling

The API returns appropriate HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid parameter format)
- `404` - Not Found (country/state not found)
- `500` - Internal Server Error

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Usage Examples

### cURL Examples

1. **Get all countries:**
```bash
curl -X GET "http://localhost:4500/api/locations/countries" -H "Content-Type: application/json"
```

2. **Get states for Afghanistan (ID: 1):**
```bash
curl -X GET "http://localhost:4500/api/locations/states/1" -H "Content-Type: application/json"
```

3. **Get cities for Badakhshan state (ID: 3901):**
```bash
curl -X GET "http://localhost:4500/api/locations/cities/3901" -H "Content-Type: application/json"
```

### JavaScript/Fetch Examples

```javascript
// Get all countries
const countries = await fetch('http://localhost:4500/api/locations/countries')
  .then(response => response.json());

// Get states for a specific country
const states = await fetch(`http://localhost:4500/api/locations/states/1`)
  .then(response => response.json());

// Get cities for a specific state
const cities = await fetch(`http://localhost:4500/api/locations/cities/3901`)
  .then(response => response.json());
```

## Data Structure

### Country Fields
- `id`: Unique identifier
- `name`: Country name in English
- `iso3`: 3-letter ISO country code
- `iso2`: 2-letter ISO country code
- `phone_code`: International dialing code
- `capital`: Capital city name
- `currency`: Currency code (ISO 4217)
- `currency_symbol`: Currency symbol
- `tld`: Top-level domain
- `native`: Country name in native language
- `region`: Geographic region
- `subregion`: Geographic subregion
- `latitude`: Latitude coordinate
- `longitude`: Longitude coordinate
- `emoji`: Country flag emoji
- `emojiU`: Unicode representation of flag

### State Fields
- `id`: Unique identifier
- `name`: State/province name
- `state_code`: State code abbreviation
- `latitude`: Latitude coordinate
- `longitude`: Longitude coordinate

### City Fields
- `id`: Unique identifier
- `name`: City name
- `latitude`: Latitude coordinate
- `longitude`: Longitude coordinate

## Notes
- All endpoints are public and do not require authentication
- The API uses data from a comprehensive locations database with 250+ countries
- Coordinates are provided as strings in decimal degrees format
- Some countries may have no states (returns empty array)
- Some states may have no cities (returns empty array)