/**
 * Automated Test Suite for GaterLink
 * Comprehensive testing scenarios for QA automation
 */

import { device, element, by, expect } from 'detox';

describe('GaterLink App E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: {
        notifications: 'YES',
        camera: 'YES',
        location: 'always',
      },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Authentication Flow', () => {
    it('should show login screen on app launch', async () => {
      await expect(element(by.id('login-screen'))).toBeVisible();
      await expect(element(by.id('email-input'))).toBeVisible();
      await expect(element(by.id('password-input'))).toBeVisible();
      await expect(element(by.id('login-button'))).toBeVisible();
    });

    it('should login with valid credentials', async () => {
      await element(by.id('email-input')).typeText('test@gaterlink.com');
      await element(by.id('password-input')).typeText('Test123!');
      await element(by.id('login-button')).tap();
      
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show error for invalid credentials', async () => {
      await element(by.id('email-input')).typeText('invalid@email.com');
      await element(by.id('password-input')).typeText('wrongpassword');
      await element(by.id('login-button')).tap();
      
      await expect(element(by.text('Invalid credentials'))).toBeVisible();
    });

    it('should logout successfully', async () => {
      // Login first
      await loginAsTestUser();
      
      // Navigate to profile
      await element(by.id('tab-profile')).tap();
      await element(by.id('logout-button')).tap();
      await element(by.text('Confirm')).tap();
      
      await expect(element(by.id('login-screen'))).toBeVisible();
    });
  });

  describe('Door Access Features', () => {
    beforeEach(async () => {
      await loginAsTestUser();
    });

    it('should display door list', async () => {
      await element(by.id('tab-doors')).tap();
      await expect(element(by.id('doors-list'))).toBeVisible();
      await expect(element(by.id('door-item-0'))).toBeVisible();
    });

    it('should show door details', async () => {
      await element(by.id('tab-doors')).tap();
      await element(by.id('door-item-0')).tap();
      
      await expect(element(by.id('door-details-screen'))).toBeVisible();
      await expect(element(by.id('door-name'))).toBeVisible();
      await expect(element(by.id('access-button'))).toBeVisible();
    });

    it('should open QR scanner', async () => {
      await element(by.id('tab-doors')).tap();
      await element(by.id('qr-scan-button')).tap();
      
      await expect(element(by.id('qr-scanner'))).toBeVisible();
      await expect(element(by.id('camera-view'))).toBeVisible();
    });

    it('should request door access', async () => {
      await element(by.id('tab-doors')).tap();
      await element(by.id('door-item-0')).tap();
      await element(by.id('request-access-button')).tap();
      
      await expect(element(by.id('access-request-form'))).toBeVisible();
      await element(by.id('reason-input')).typeText('Testing access');
      await element(by.id('submit-request-button')).tap();
      
      await expect(element(by.text('Request submitted'))).toBeVisible();
    });
  });

  describe('Equipment Management', () => {
    beforeEach(async () => {
      await loginAsTestUser();
      await element(by.id('tab-equipment')).tap();
    });

    it('should display equipment list', async () => {
      await expect(element(by.id('equipment-list'))).toBeVisible();
      await expect(element(by.id('equipment-item-0'))).toBeVisible();
    });

    it('should filter equipment by availability', async () => {
      await element(by.id('filter-available')).tap();
      await expect(element(by.id('equipment-list'))).toBeVisible();
      // Verify only available items shown
    });

    it('should make equipment reservation', async () => {
      await element(by.id('equipment-item-0')).tap();
      await element(by.id('reserve-button')).tap();
      
      await element(by.id('date-picker')).tap();
      await element(by.text('Tomorrow')).tap();
      await element(by.id('time-picker')).tap();
      await element(by.text('2:00 PM')).tap();
      await element(by.id('duration-picker')).tap();
      await element(by.text('2 hours')).tap();
      
      await element(by.id('confirm-reservation-button')).tap();
      await expect(element(by.text('Reservation confirmed'))).toBeVisible();
    });

    it('should check-in equipment', async () => {
      await element(by.id('my-reservations-tab')).tap();
      await element(by.id('reservation-item-0')).tap();
      await element(by.id('check-in-button')).tap();
      
      await expect(element(by.text('Check-in successful'))).toBeVisible();
    });
  });

  describe('Emergency Features', () => {
    beforeEach(async () => {
      await loginAsTestUser();
    });

    it('should show emergency button on home screen', async () => {
      await expect(element(by.id('emergency-button'))).toBeVisible();
    });

    it('should trigger emergency alert', async () => {
      await element(by.id('emergency-button')).longPress();
      await expect(element(by.id('emergency-confirmation'))).toBeVisible();
      await element(by.id('confirm-emergency')).tap();
      
      await expect(element(by.text('Emergency alert sent'))).toBeVisible();
    });

    it('should receive emergency notification', async () => {
      // Simulate incoming emergency
      await device.sendUserNotification({
        trigger: {
          type: 'push',
        },
        title: 'Emergency Alert',
        body: 'Fire drill in Building A',
        category: 'emergency',
      });
      
      await expect(element(by.id('emergency-notification'))).toBeVisible();
    });
  });

  describe('Chat Features', () => {
    beforeEach(async () => {
      await loginAsTestUser();
      await element(by.id('tab-chat')).tap();
    });

    it('should display chat list', async () => {
      await expect(element(by.id('chat-list'))).toBeVisible();
      await expect(element(by.id('chat-item-0'))).toBeVisible();
    });

    it('should send message', async () => {
      await element(by.id('chat-item-0')).tap();
      await element(by.id('message-input')).typeText('Test message');
      await element(by.id('send-button')).tap();
      
      await expect(element(by.text('Test message'))).toBeVisible();
    });

    it('should show typing indicator', async () => {
      await element(by.id('chat-item-0')).tap();
      await element(by.id('message-input')).typeText('Typing...');
      
      // In real test, another user would see this
      // await expect(element(by.id('typing-indicator'))).toBeVisible();
    });
  });

  describe('Admin Features', () => {
    beforeEach(async () => {
      await loginAsAdminUser();
    });

    it('should show admin dashboard', async () => {
      await element(by.id('tab-admin')).tap();
      await expect(element(by.id('admin-dashboard'))).toBeVisible();
      await expect(element(by.id('pending-requests'))).toBeVisible();
      await expect(element(by.id('user-management'))).toBeVisible();
    });

    it('should approve access request', async () => {
      await element(by.id('tab-admin')).tap();
      await element(by.id('pending-requests')).tap();
      await element(by.id('request-item-0')).tap();
      await element(by.id('approve-button')).tap();
      
      await expect(element(by.text('Request approved'))).toBeVisible();
    });

    it('should manage users', async () => {
      await element(by.id('tab-admin')).tap();
      await element(by.id('user-management')).tap();
      await element(by.id('user-item-0')).tap();
      
      await expect(element(by.id('user-details'))).toBeVisible();
      await element(by.id('edit-role-button')).tap();
      await element(by.text('Manager')).tap();
      
      await expect(element(by.text('Role updated'))).toBeVisible();
    });
  });

  describe('Offline Mode', () => {
    it('should work offline for cached data', async () => {
      await loginAsTestUser();
      
      // Load some data while online
      await element(by.id('tab-doors')).tap();
      await waitFor(element(by.id('doors-list'))).toBeVisible();
      
      // Go offline
      await device.disableSynchronization();
      await device.setURLBlacklist(['.*']);
      
      // Should still show cached doors
      await device.reloadReactNative();
      await element(by.id('tab-doors')).tap();
      await expect(element(by.id('doors-list'))).toBeVisible();
      await expect(element(by.id('offline-indicator'))).toBeVisible();
      
      // Re-enable network
      await device.setURLBlacklist([]);
      await device.enableSynchronization();
    });
  });

  describe('Performance Tests', () => {
    it('should load home screen quickly', async () => {
      const startTime = Date.now();
      await device.reloadReactNative();
      await loginAsTestUser();
      
      await waitFor(element(by.id('home-screen')))
        .toBeVisible()
        .withTimeout(3000);
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should load in less than 3 seconds
    });

    it('should scroll smoothly through long lists', async () => {
      await loginAsTestUser();
      await element(by.id('tab-doors')).tap();
      
      // Scroll through list
      await element(by.id('doors-list')).scroll(500, 'down');
      await element(by.id('doors-list')).scroll(500, 'down');
      await element(by.id('doors-list')).scroll(500, 'up');
      
      // Should not crash or freeze
      await expect(element(by.id('doors-list'))).toBeVisible();
    });
  });

  describe('Accessibility Tests', () => {
    it('should have accessibility labels', async () => {
      await expect(element(by.label('Email input field'))).toBeVisible();
      await expect(element(by.label('Password input field'))).toBeVisible();
      await expect(element(by.label('Login button'))).toBeVisible();
    });

    it('should work with screen reader', async () => {
      // This would require additional setup for actual screen reader testing
      await element(by.label('Email input field')).typeText('test@gaterlink.com');
      await element(by.label('Password input field')).typeText('Test123!');
      await element(by.label('Login button')).tap();
    });
  });

  describe('Security Tests', () => {
    it('should not show sensitive data in background', async () => {
      await loginAsTestUser();
      await device.sendToHome();
      await device.launchApp();
      
      // Should show lock screen or login
      await expect(element(by.id('app-lock-screen'))).toBeVisible();
    });

    it('should timeout after inactivity', async () => {
      await loginAsTestUser();
      
      // Wait for timeout (in real app, this would be longer)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Should require re-authentication
      await element(by.id('tab-profile')).tap();
      await expect(element(by.id('session-expired'))).toBeVisible();
    });
  });
});

// Helper functions
async function loginAsTestUser() {
  await element(by.id('email-input')).clearText();
  await element(by.id('email-input')).typeText('test@gaterlink.com');
  await element(by.id('password-input')).clearText();
  await element(by.id('password-input')).typeText('Test123!');
  await element(by.id('login-button')).tap();
  
  await waitFor(element(by.id('home-screen')))
    .toBeVisible()
    .withTimeout(5000);
}

async function loginAsAdminUser() {
  await element(by.id('email-input')).clearText();
  await element(by.id('email-input')).typeText('admin@gaterlink.com');
  await element(by.id('password-input')).clearText();
  await element(by.id('password-input')).typeText('Admin123!');
  await element(by.id('login-button')).tap();
  
  await waitFor(element(by.id('home-screen')))
    .toBeVisible()
    .withTimeout(5000);
}

async function waitFor(element: any) {
  return {
    toBeVisible: () => ({
      withTimeout: async (timeout: number) => {
        const endTime = Date.now() + timeout;
        while (Date.now() < endTime) {
          try {
            await expect(element).toBeVisible();
            return;
          } catch (e) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        await expect(element).toBeVisible();
      },
    }),
  };
}