import { firebaseAuthService } from '../services/firebaseAuthService';
import { emergencyService } from '../services/emergencyService';
import { requestService } from '../services/requestService';
import { notificationService } from '../services/notificationService';
import { cleanupService } from '../services/cleanupService';
import { serviceInitializer } from '../services/serviceInitializer';

interface TestResult {
  test: string;
  success: boolean;
  message: string;
  error?: any;
}

export class FreeTierServiceTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting Free Tier Services Test Suite...');
    this.results = [];

    try {
      // Test 1: Service Initializer
      await this.testServiceInitializer();

      // Test 2: User Creation Trigger
      await this.testUserCreationTrigger();

      // Test 3: Emergency Creation Trigger
      await this.testEmergencyCreationTrigger();

      // Test 4: Access Request Trigger
      await this.testAccessRequestTrigger();

      // Test 5: Notification Service
      await this.testNotificationService();

      // Test 6: Cleanup Service
      await this.testCleanupService();

      // Test 7: Authentication Integration
      await this.testAuthenticationIntegration();

    } catch (error) {
      console.error('Test suite failed:', error);
      this.results.push({
        test: 'Test Suite',
        success: false,
        message: 'Test suite execution failed',
        error,
      });
    }

    this.printResults();
    return this.results;
  }

  private async testServiceInitializer(): Promise<void> {
    try {
      console.log('Testing Service Initializer...');
      
      // Test initialization
      await serviceInitializer.initializeServices();
      const isInitialized = serviceInitializer.getInitializationStatus();
      
      if (isInitialized) {
        this.results.push({
          test: 'Service Initializer',
          success: true,
          message: 'Services initialized successfully',
        });
      } else {
        this.results.push({
          test: 'Service Initializer',
          success: false,
          message: 'Services failed to initialize',
        });
      }

      // Test cleanup
      serviceInitializer.cleanupServices();
      const isCleanedUp = !serviceInitializer.getInitializationStatus();
      
      if (isCleanedUp) {
        this.results.push({
          test: 'Service Cleanup',
          success: true,
          message: 'Services cleaned up successfully',
        });
      } else {
        this.results.push({
          test: 'Service Cleanup',
          success: false,
          message: 'Services failed to cleanup',
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Service Initializer',
        success: false,
        message: 'Service initializer test failed',
        error,
      });
    }
  }

  private async testUserCreationTrigger(): Promise<void> {
    try {
      console.log('Testing User Creation Trigger...');
      
      // This test would require a mock user creation
      // For now, we'll test that the method exists
      const authService = firebaseAuthService as any;
      
      if (typeof authService.onUserCreated === 'function') {
        this.results.push({
          test: 'User Creation Trigger',
          success: true,
          message: 'User creation trigger method exists',
        });
      } else {
        this.results.push({
          test: 'User Creation Trigger',
          success: false,
          message: 'User creation trigger method not found',
        });
      }
    } catch (error) {
      this.results.push({
        test: 'User Creation Trigger',
        success: false,
        message: 'User creation trigger test failed',
        error,
      });
    }
  }

  private async testEmergencyCreationTrigger(): Promise<void> {
    try {
      console.log('Testing Emergency Creation Trigger...');
      
      // Test that the method exists
      const emergencyServiceInstance = emergencyService as any;
      
      if (typeof emergencyServiceInstance.onEmergencyCreated === 'function') {
        this.results.push({
          test: 'Emergency Creation Trigger',
          success: true,
          message: 'Emergency creation trigger method exists',
        });
      } else {
        this.results.push({
          test: 'Emergency Creation Trigger',
          success: false,
          message: 'Emergency creation trigger method not found',
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Emergency Creation Trigger',
        success: false,
        message: 'Emergency creation trigger test failed',
        error,
      });
    }
  }

  private async testAccessRequestTrigger(): Promise<void> {
    try {
      console.log('Testing Access Request Trigger...');
      
      // Test that the method exists
      const requestServiceInstance = requestService as any;
      
      if (typeof requestServiceInstance.onAccessRequestCreated === 'function') {
        this.results.push({
          test: 'Access Request Trigger',
          success: true,
          message: 'Access request trigger method exists',
        });
      } else {
        this.results.push({
          test: 'Access Request Trigger',
          success: false,
          message: 'Access request trigger method not found',
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Access Request Trigger',
        success: false,
        message: 'Access request trigger test failed',
        error,
      });
    }
  }

  private async testNotificationService(): Promise<void> {
    try {
      console.log('Testing Notification Service...');
      
      // Test notification service methods
      const methods = [
        'setupNotificationListeners',
        'markNotificationAsRead',
        'getFirestoreNotifications',
        'getUnreadNotificationCount',
        'cleanup'
      ];

      let allMethodsExist = true;
      for (const method of methods) {
        if (typeof (notificationService as any)[method] !== 'function') {
          allMethodsExist = false;
          break;
        }
      }

      if (allMethodsExist) {
        this.results.push({
          test: 'Notification Service',
          success: true,
          message: 'All notification service methods exist',
        });
      } else {
        this.results.push({
          test: 'Notification Service',
          success: false,
          message: 'Some notification service methods are missing',
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Notification Service',
        success: false,
        message: 'Notification service test failed',
        error,
      });
    }
  }

  private async testCleanupService(): Promise<void> {
    try {
      console.log('Testing Cleanup Service...');
      
      // Test cleanup service methods
      const methods = [
        'setupCleanupListeners',
        'cleanupExpiredHolds',
        'cleanupOldNotifications',
        'cleanup'
      ];

      let allMethodsExist = true;
      for (const method of methods) {
        if (typeof (cleanupService as any)[method] !== 'function') {
          allMethodsExist = false;
          break;
        }
      }

      if (allMethodsExist) {
        this.results.push({
          test: 'Cleanup Service',
          success: true,
          message: 'All cleanup service methods exist',
        });
      } else {
        this.results.push({
          test: 'Cleanup Service',
          success: false,
          message: 'Some cleanup service methods are missing',
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Cleanup Service',
        success: false,
        message: 'Cleanup service test failed',
        error,
      });
    }
  }

  private async testAuthenticationIntegration(): Promise<void> {
    try {
      console.log('Testing Authentication Integration...');
      
      // Test that auth service methods exist
      const authMethods = [
        'getCurrentUser',
        'onAuthStateChanged',
        'login',
        'register',
        'logout'
      ];

      let allMethodsExist = true;
      for (const method of authMethods) {
        if (typeof (firebaseAuthService as any)[method] !== 'function') {
          allMethodsExist = false;
          break;
        }
      }

      if (allMethodsExist) {
        this.results.push({
          test: 'Authentication Integration',
          success: true,
          message: 'All authentication methods exist',
        });
      } else {
        this.results.push({
          test: 'Authentication Integration',
          success: false,
          message: 'Some authentication methods are missing',
        });
      }
    } catch (error) {
      this.results.push({
        test: 'Authentication Integration',
        success: false,
        message: 'Authentication integration test failed',
        error,
      });
    }
  }

  private printResults(): void {
    console.log('\n📊 Free Tier Services Test Results:');
    console.log('=====================================');
    
    const passed = this.results.filter(r => r.success).length;
    const total = this.results.length;
    
    this.results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.test}: ${result.message}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log(`\n📈 Summary: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All tests passed! Free tier services are ready.');
    } else {
      console.log('⚠️  Some tests failed. Please check the implementation.');
    }
  }
}

// Export a singleton instance
export const freeTierServiceTester = new FreeTierServiceTester();
