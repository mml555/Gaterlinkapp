# Environment Setup Guide

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:ios:abcdef123456

# API Configuration
API_BASE_URL=https://api.gaterlink.com
API_TIMEOUT=30000

# App Configuration
APP_ENV=development
DEBUG_MODE=true
```

## Usage in Code

Import environment variables in your React Native code:

```javascript
import { FIREBASE_API_KEY, API_BASE_URL } from '@env';

console.log('Firebase API Key:', FIREBASE_API_KEY);
console.log('API Base URL:', API_BASE_URL);
```

## Security Notes

- Never commit the `.env` file to version control
- Add `.env` to your `.gitignore` file
- Use different environment variables for development, staging, and production
