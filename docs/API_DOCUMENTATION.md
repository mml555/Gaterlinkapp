# 📚 GaterLink API Documentation

## Overview

The GaterLink API provides programmatic access to all platform features including door access management, equipment reservations, and real-time communications.

## Base URLs

```
Production: https://api.gaterlink.com/v1
Staging: https://api-staging.gaterlink.com/v1
WebSocket: wss://socket.gaterlink.com
```

## Authentication

All API requests require authentication using Firebase Auth tokens.

### Headers
```http
Authorization: Bearer YOUR_FIREBASE_TOKEN
Content-Type: application/json
X-API-Version: 1.0
```

### Getting a Token
```javascript
const token = await firebase.auth().currentUser.getIdToken();
```

## API Endpoints

### Authentication

#### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "uid": "abc123",
      "email": "user@example.com",
      "role": "user",
      "displayName": "John Doe"
    },
    "token": "eyJhbGc..."
  }
}
```

#### Register
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "displayName": "John Doe",
  "organization": "ACME Corp"
}
```

### Doors

#### List Doors
```http
GET /doors
```

**Query Parameters:**
- `siteId` (optional): Filter by site
- `accessible` (optional): Filter by user access
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "doors": [
      {
        "id": "door123",
        "name": "Main Entrance",
        "location": "Building A",
        "siteId": "site123",
        "status": "active",
        "requiresApproval": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45
    }
  }
}
```

#### Get Door Details
```http
GET /doors/:doorId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "door123",
    "name": "Main Entrance",
    "location": "Building A",
    "description": "Primary entrance to the building",
    "siteId": "site123",
    "status": "active",
    "requiresApproval": false,
    "accessSchedule": {
      "monday": { "start": "07:00", "end": "22:00" },
      "tuesday": { "start": "07:00", "end": "22:00" }
    },
    "features": ["qr_code", "nfc", "biometric"]
  }
}
```

#### Request Door Access
```http
POST /doors/:doorId/access-request
```

**Request Body:**
```json
{
  "reason": "Client meeting",
  "startDate": "2025-08-21T09:00:00Z",
  "endDate": "2025-08-21T17:00:00Z",
  "recurring": false
}
```

### Equipment

#### List Equipment
```http
GET /equipment
```

**Query Parameters:**
- `siteId` (optional): Filter by site
- `available` (optional): Filter by availability
- `category` (optional): Filter by category
- `search` (optional): Search term

**Response:**
```json
{
  "success": true,
  "data": {
    "equipment": [
      {
        "id": "equip123",
        "name": "Conference Room Projector",
        "category": "AV Equipment",
        "location": "Floor 3",
        "status": "available",
        "imageUrl": "https://..."
      }
    ]
  }
}
```

#### Make Reservation
```http
POST /equipment/:equipmentId/reservations
```

**Request Body:**
```json
{
  "startTime": "2025-08-21T14:00:00Z",
  "endTime": "2025-08-21T16:00:00Z",
  "purpose": "Team presentation",
  "notes": "Need HDMI cable"
}
```

### Emergency

#### Trigger Emergency
```http
POST /emergency/trigger
```

**Request Body:**
```json
{
  "type": "fire_drill",
  "location": "Building A",
  "severity": "high",
  "message": "Fire drill in progress. Please evacuate.",
  "notifyAll": true
}
```

#### Get Active Emergencies
```http
GET /emergency/active
```

**Response:**
```json
{
  "success": true,
  "data": {
    "emergencies": [
      {
        "id": "emrg123",
        "type": "fire_drill",
        "location": "Building A",
        "severity": "high",
        "message": "Fire drill in progress",
        "triggeredBy": "admin123",
        "triggeredAt": "2025-08-20T10:00:00Z",
        "status": "active"
      }
    ]
  }
}
```

### Users

#### Get User Profile
```http
GET /users/profile
```

**Response:**
```json
{
  "success": true,
  "data": {
    "uid": "user123",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "user",
    "department": "Engineering",
    "siteIds": ["site123", "site456"],
    "permissions": ["door_access", "equipment_reservation"],
    "profileImageUrl": "https://..."
  }
}
```

#### Update Profile
```http
PUT /users/profile
```

**Request Body:**
```json
{
  "displayName": "John Smith",
  "department": "IT",
  "phoneNumber": "+1234567890"
}
```

### Admin Endpoints

#### List Pending Requests
```http
GET /admin/requests/pending
```

**Response:**
```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "req123",
        "type": "door_access",
        "userId": "user123",
        "userEmail": "user@example.com",
        "doorId": "door123",
        "doorName": "Server Room",
        "reason": "Maintenance",
        "requestedAt": "2025-08-20T09:00:00Z"
      }
    ]
  }
}
```

#### Approve/Reject Request
```http
POST /admin/requests/:requestId/decision
```

**Request Body:**
```json
{
  "decision": "approved",
  "comments": "Approved for one-time access",
  "validUntil": "2025-08-21T17:00:00Z"
}
```

## WebSocket Events

### Connection
```javascript
const socket = io('wss://socket.gaterlink.com', {
  auth: {
    token: firebaseToken
  }
});
```

### Events

#### Subscribe to Updates
```javascript
// Join rooms
socket.emit('join:room', { 
  roomId: 'site:site123', 
  type: 'site' 
});

// Listen for door status updates
socket.on('door:status', (data) => {
  console.log('Door status updated:', data);
});

// Listen for emergency alerts
socket.on('emergency:alert', (data) => {
  console.log('Emergency alert:', data);
});

// Send message
socket.emit('message:send', {
  roomId: 'chat123',
  content: 'Hello team!',
  type: 'text'
});
```

### Event Types

| Event | Direction | Description |
|-------|-----------|-------------|
| `connected` | Server → Client | Connection established |
| `join:room` | Client → Server | Join a room |
| `leave:room` | Client → Server | Leave a room |
| `message:send` | Client → Server | Send message |
| `message:received` | Server → Client | Receive message |
| `door:status` | Server → Client | Door status update |
| `equipment:status` | Server → Client | Equipment status update |
| `emergency:alert` | Server → Client | Emergency notification |
| `presence:update` | Client → Server | Update user presence |

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid authentication token",
    "details": {}
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

## Rate Limiting

- **General endpoints**: 100 requests per minute
- **Authentication endpoints**: 10 requests per minute
- **Emergency endpoints**: No rate limit
- **WebSocket connections**: 5 per user

## Pagination

Endpoints that return lists support pagination:

```http
GET /doors?page=2&limit=20
```

**Response includes:**
```json
{
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 145,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": true
  }
}
```

## Webhooks

Configure webhooks for real-time notifications:

```http
POST /admin/webhooks
```

**Request Body:**
```json
{
  "url": "https://your-server.com/webhook",
  "events": ["door.accessed", "emergency.triggered", "equipment.reserved"],
  "secret": "your-webhook-secret"
}
```

## SDK Examples

### JavaScript/TypeScript
```typescript
import { GaterLinkClient } from '@gaterlink/sdk';

const client = new GaterLinkClient({
  apiKey: 'your-api-key',
  environment: 'production'
});

// List doors
const doors = await client.doors.list({ 
  siteId: 'site123' 
});

// Request access
const request = await client.doors.requestAccess('door123', {
  reason: 'Client meeting',
  duration: '8h'
});
```

## Testing

### Test Environment
```
Base URL: https://api-test.gaterlink.com/v1
Test Account: test@gaterlink.com / TestPassword123
```

### Postman Collection
Download our [Postman Collection](https://www.getpostman.com/collections/gaterlink-api) for easy testing.

## Changelog

### Version 1.0.0 (Current)
- Initial API release
- Door access management
- Equipment reservations
- Emergency system
- Real-time WebSocket events

---

For additional support, contact api-support@gaterlink.com