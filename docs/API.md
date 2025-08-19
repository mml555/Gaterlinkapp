# 🔌 GaterLink App - API Documentation

*Last Updated: January 2024*

## 📋 Overview

This document provides comprehensive documentation for the GaterLink App API endpoints, data models, and integration guidelines.

## 🔐 Authentication

### Firebase Authentication

The app uses Firebase Authentication for user management. All API requests require a valid Firebase ID token.

#### Authentication Flow

```typescript
// 1. User signs in with email/password
const userCredential = await signInWithEmailAndPassword(auth, email, password);

// 2. Get ID token for API requests
const idToken = await userCredential.user.getIdToken();

// 3. Include token in API headers
const headers = {
  'Authorization': `Bearer ${idToken}`,
  'Content-Type': 'application/json'
};
```

#### Error Responses

```json
{
  "error": {
    "code": "auth/invalid-email",
    "message": "The email address is badly formatted."
  }
}
```

## 🏠 Door Management API

### Get Available Doors

**Endpoint:** `GET /api/doors`

**Description:** Retrieve all available doors for the authenticated user.

**Headers:**
```
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "door_123",
      "name": "Main Entrance",
      "location": "Building A, Floor 1",
      "description": "Primary entrance to the building",
      "status": "active",
      "accessLevel": "public",
      "qrCode": "https://api.gaterlinkapp.com/qr/door_123",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

### Get Door Details

**Endpoint:** `GET /api/doors/{doorId}`

**Description:** Retrieve detailed information about a specific door.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "door_123",
    "name": "Main Entrance",
    "location": "Building A, Floor 1",
    "description": "Primary entrance to the building",
    "status": "active",
    "accessLevel": "public",
    "qrCode": "https://api.gaterlinkapp.com/qr/door_123",
    "permissions": [
      {
        "userId": "user_456",
        "accessLevel": "full",
        "grantedAt": "2024-01-15T10:30:00Z",
        "expiresAt": "2024-12-31T23:59:59Z"
      }
    ],
    "accessHistory": [
      {
        "userId": "user_456",
        "timestamp": "2024-01-15T10:30:00Z",
        "method": "qr_scan",
        "status": "success"
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Scan QR Code

**Endpoint:** `POST /api/doors/{doorId}/scan`

**Description:** Attempt to access a door using QR code scan.

**Request Body:**
```json
{
  "qrCode": "gaterlink://door/door_123?token=abc123",
  "timestamp": "2024-01-15T10:30:00Z",
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessGranted": true,
    "message": "Access granted to Main Entrance",
    "doorId": "door_123",
    "timestamp": "2024-01-15T10:30:00Z",
    "expiresAt": "2024-01-15T11:30:00Z"
  }
}
```

## 📝 Access Request API

### Create Access Request

**Endpoint:** `POST /api/requests`

**Description:** Create a new access request.

**Request Body:**
```json
{
  "doorId": "door_123",
  "type": "temporary",
  "duration": "2_hours",
  "reason": "Meeting with client",
  "startTime": "2024-01-15T14:00:00Z",
  "endTime": "2024-01-15T16:00:00Z",
  "priority": "normal"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "req_789",
    "doorId": "door_123",
    "requesterId": "user_456",
    "status": "pending",
    "type": "temporary",
    "duration": "2_hours",
    "reason": "Meeting with client",
    "startTime": "2024-01-15T14:00:00Z",
    "endTime": "2024-01-15T16:00:00Z",
    "priority": "normal",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get User Requests

**Endpoint:** `GET /api/requests/user`

**Description:** Retrieve all requests for the authenticated user.

**Query Parameters:**
- `status` (optional): Filter by status (pending, approved, rejected)
- `type` (optional): Filter by type (temporary, permanent)
- `page` (optional): Page number for pagination
- `limit` (optional): Number of items per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "req_789",
      "doorId": "door_123",
      "doorName": "Main Entrance",
      "status": "approved",
      "type": "temporary",
      "duration": "2_hours",
      "reason": "Meeting with client",
      "startTime": "2024-01-15T14:00:00Z",
      "endTime": "2024-01-15T16:00:00Z",
      "priority": "normal",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

### Update Request Status (Admin Only)

**Endpoint:** `PUT /api/requests/{requestId}/status`

**Description:** Update the status of an access request (admin only).

**Request Body:**
```json
{
  "status": "approved",
  "comment": "Request approved for client meeting",
  "adminId": "admin_123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "req_789",
    "status": "approved",
    "comment": "Request approved for client meeting",
    "adminId": "admin_123",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

## 💬 Chat API

### Get Chat Conversations

**Endpoint:** `GET /api/chat/conversations`

**Description:** Retrieve all chat conversations for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "conv_123",
      "participants": [
        {
          "id": "user_456",
          "name": "John Doe",
          "role": "customer"
        },
        {
          "id": "admin_123",
          "name": "Admin User",
          "role": "admin"
        }
      ],
      "lastMessage": {
        "id": "msg_789",
        "content": "Your request has been approved",
        "senderId": "admin_123",
        "timestamp": "2024-01-15T11:00:00Z"
      },
      "unreadCount": 1,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T11:00:00Z"
    }
  ]
}
```

### Get Chat Messages

**Endpoint:** `GET /api/chat/conversations/{conversationId}/messages`

**Description:** Retrieve messages for a specific conversation.

**Query Parameters:**
- `page` (optional): Page number for pagination
- `limit` (optional): Number of messages per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg_789",
      "conversationId": "conv_123",
      "content": "Your request has been approved",
      "senderId": "admin_123",
      "senderName": "Admin User",
      "timestamp": "2024-01-15T11:00:00Z",
      "read": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "pages": 1
  }
}
```

### Send Message

**Endpoint:** `POST /api/chat/conversations/{conversationId}/messages`

**Description:** Send a new message in a conversation.

**Request Body:**
```json
{
  "content": "Thank you for the approval!",
  "type": "text"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "msg_790",
    "conversationId": "conv_123",
    "content": "Thank you for the approval!",
    "senderId": "user_456",
    "senderName": "John Doe",
    "timestamp": "2024-01-15T11:05:00Z",
    "read": false
  }
}
```

## 🔔 Notifications API

### Get Notifications

**Endpoint:** `GET /api/notifications`

**Description:** Retrieve notifications for the authenticated user.

**Query Parameters:**
- `type` (optional): Filter by notification type
- `read` (optional): Filter by read status
- `page` (optional): Page number for pagination
- `limit` (optional): Number of notifications per page

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_123",
      "title": "Access Request Approved",
      "message": "Your request for Main Entrance has been approved",
      "type": "request_update",
      "read": false,
      "data": {
        "requestId": "req_789",
        "doorId": "door_123"
      },
      "timestamp": "2024-01-15T11:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

### Mark Notification as Read

**Endpoint:** `PUT /api/notifications/{notificationId}/read`

**Description:** Mark a notification as read.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "notif_123",
    "read": true,
    "readAt": "2024-01-15T11:05:00Z"
  }
}
```

## 👤 User Management API

### Get User Profile

**Endpoint:** `GET /api/users/profile`

**Description:** Retrieve the profile of the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_456",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "customer",
    "phone": "+1234567890",
    "profilePicture": "https://api.gaterlinkapp.com/profile/user_456.jpg",
    "biometricEnabled": true,
    "preferences": {
      "notifications": {
        "email": true,
        "push": true,
        "sms": false
      },
      "theme": "light",
      "language": "en"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Update User Profile

**Endpoint:** `PUT /api/users/profile`

**Description:** Update the profile of the authenticated user.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "preferences": {
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    },
    "theme": "dark",
    "language": "en"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_456",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "preferences": {
      "notifications": {
        "email": true,
        "push": true,
        "sms": false
      },
      "theme": "dark",
      "language": "en"
    },
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

## 📊 Analytics API (Admin Only)

### Get Request Analytics

**Endpoint:** `GET /api/analytics/requests`

**Description:** Retrieve analytics data for access requests (admin only).

**Query Parameters:**
- `startDate` (optional): Start date for analytics period
- `endDate` (optional): End date for analytics period
- `groupBy` (optional): Group by field (day, week, month, door)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRequests": 150,
    "pendingRequests": 25,
    "approvedRequests": 120,
    "rejectedRequests": 5,
    "averageResponseTime": "2.5 hours",
    "requestsByStatus": {
      "pending": 25,
      "approved": 120,
      "rejected": 5
    },
    "requestsByDoor": {
      "door_123": 50,
      "door_456": 100
    },
    "requestsByType": {
      "temporary": 100,
      "permanent": 50
    },
    "dailyTrends": [
      {
        "date": "2024-01-15",
        "requests": 10,
        "approved": 8,
        "rejected": 2
      }
    ]
  }
}
```

## 🚨 Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### Common Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `UNAUTHORIZED` | Invalid or missing authentication token | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `VALIDATION_ERROR` | Invalid request data | 400 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |

## 📡 WebSocket Events

### Real-time Updates

The app uses WebSocket connections for real-time updates.

#### Connection

```javascript
const socket = io('wss://api.gaterlinkapp.com', {
  auth: {
    token: firebaseIdToken
  }
});
```

#### Events

**Request Status Update:**
```javascript
socket.on('request:status_update', (data) => {
  console.log('Request status updated:', data);
  // data: { requestId, status, comment, timestamp }
});
```

**New Message:**
```javascript
socket.on('chat:new_message', (data) => {
  console.log('New message received:', data);
  // data: { conversationId, message }
});
```

**New Notification:**
```javascript
socket.on('notification:new', (data) => {
  console.log('New notification:', data);
  // data: { notification }
});
```

## 🔧 SDK Integration

### React Native SDK

```typescript
import { GaterLinkSDK } from '@gaterlink/react-native-sdk';

const sdk = new GaterLinkSDK({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Initialize with Firebase token
await sdk.initialize(firebaseIdToken);

// Get available doors
const doors = await sdk.doors.getAvailable();

// Create access request
const request = await sdk.requests.create({
  doorId: 'door_123',
  type: 'temporary',
  duration: '2_hours',
  reason: 'Meeting'
});
```

## 📋 Rate Limits

| Endpoint | Rate Limit |
|----------|------------|
| Authentication | 10 requests/minute |
| Door Management | 100 requests/minute |
| Access Requests | 50 requests/minute |
| Chat Messages | 200 requests/minute |
| Notifications | 100 requests/minute |

## 🔐 Security

### Best Practices

1. **Always use HTTPS** for all API requests
2. **Validate Firebase tokens** on every request
3. **Implement proper error handling**
4. **Use rate limiting** to prevent abuse
5. **Log all API requests** for monitoring
6. **Implement request signing** for sensitive operations

### Data Encryption

- All sensitive data is encrypted at rest
- API communications use TLS 1.3
- Firebase tokens are validated on every request
- User passwords are hashed using bcrypt

---

*For additional support, contact: api-support@gaterlinkapp.com*
