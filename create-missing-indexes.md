# Missing Firebase Indexes - Manual Creation Guide

## Current Issue
The app is showing `failed-precondition` errors for missing Firestore indexes. The automatic deployment is having conflicts with existing indexes.

## Required Indexes

### 1. Notifications Collection Index
**Collection:** `notifications`
**Fields:**
- `userId` (Ascending)
- `updatedAt` (Ascending) 
- `__name__` (Ascending)

**Steps to create:**
1. Go to [Firebase Console](https://console.firebase.google.com/project/gaterlink-app/firestore/indexes)
2. Click "Create Index"
3. Collection ID: `notifications`
4. Add fields:
   - Field path: `userId`, Order: `Ascending`
   - Field path: `updatedAt`, Order: `Ascending`
   - Field path: `__name__`, Order: `Ascending`
5. Click "Create"

### 2. Holds Collection Index
**Collection:** `holds`
**Fields:**
- `status` (Ascending)
- `expiresAt` (Ascending)
- `__name__` (Ascending)

**Steps to create:**
1. Go to [Firebase Console](https://console.firebase.google.com/project/gaterlink-app/firestore/indexes)
2. Click "Create Index"
3. Collection ID: `holds`
4. Add fields:
   - Field path: `status`, Order: `Ascending`
   - Field path: `expiresAt`, Order: `Ascending`
   - Field path: `__name__`, Order: `Ascending`
5. Click "Create"

## Alternative: Use Error Links
The console errors provide direct links to create the missing indexes:

1. **Notifications Index Link:**
   ```
   https://console.firebase.google.com/v1/r/project/gaterlink-app/firestore/indexes?create_composite=ClNwcm9qZWN0cy9nYXRlcmxpbmstYXBwL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9ub3RpZmljYXRpb25zL2luZGV4ZXMvXxABGgoKBnVzZXJJZBABGg0KCXVwZGF0ZWRBdBACGgwKCF9fbmFtZV9fEAI
   ```

2. **Holds Index Link:**
   ```
   https://console.firebase.google.com/v1/r/project/gaterlink-app/firestore/indexes?create_composite=Cktwcm9qZWN0cy9nYXRlcmxpbmstYXBwL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9ob2xkcy9pbmRleGVzL18QARoKCgZzdGF0dXMQARoNCglleHBpcmVzQXQQARoMCghfX25hbWVfXxAB
   ```

## Index Building Time
After creating the indexes, they will take a few minutes to build. You can monitor the progress in the Firebase Console.

## Verification
Once the indexes are built, the `failed-precondition` errors should stop appearing in the console logs.

## Service Status Monitoring
The app now includes a ServiceStatusIndicator component on the HomeScreen that shows:
- Real-time service initialization status
- Number of initialization attempts
- Retry button for manual reinitialization

This will help you monitor when services are properly initialized and when there are issues.
