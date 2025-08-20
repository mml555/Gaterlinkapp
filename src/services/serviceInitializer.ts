import { firebaseAuthService } from './firebaseAuthService';
import { cleanupService } from './cleanupService';
import { notificationService } from './notificationService';
import { auth } from '../config/firebase';

class ServiceInitializer {
  private isInitialized = false;

  // Initialize all client-side services and listeners
  async initializeServices(): Promise<void> {
    if (this.isInitialized) {
      console.log('Services already initialized');
      return;
    }

    try {
      console.log('Initializing client-side services for free tier...');

      // Check if Firebase auth is available
      if (!auth) {
        console.log('Firebase auth not available, skipping service initialization');
        return;
      }

      // Wait for authentication to be ready
      await this.waitForAuth();

      // Get current user
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        console.log('No authenticated user, skipping service initialization');
        return;
      }

      // Initialize cleanup service
      console.log('Setting up cleanup listeners...');
      cleanupService.setupCleanupListeners();

      // Initialize notification service
      console.log('Setting up notification listeners...');
      notificationService.setupNotificationListeners(currentUser.id);

      // Setup auth state change listener
      this.setupAuthStateListener();

      this.isInitialized = true;
      console.log('✅ All client-side services initialized successfully');
    } catch (error) {
      console.error('Error initializing services:', error);
      throw error;
    }
  }

  // Wait for Firebase Auth to be ready
  private async waitForAuth(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds timeout
      
      const checkAuth = () => {
        attempts++;
        if (auth && auth.currentUser !== null) {
          resolve();
        } else if (attempts >= maxAttempts) {
          console.log('Timeout waiting for Firebase auth to be ready');
          resolve(); // Resolve anyway to prevent blocking
        } else {
          setTimeout(checkAuth, 100);
        }
      };
      checkAuth();
    });
  }

  // Setup auth state change listener to reinitialize services when user changes
  private setupAuthStateListener(): void {
    firebaseAuthService.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('User authenticated, reinitializing services...');
        this.isInitialized = false;
        await this.initializeServices();
      } else {
        console.log('User signed out, cleaning up services...');
        this.cleanupServices();
      }
    });
  }

  // Cleanup all services and listeners
  cleanupServices(): void {
    console.log('Cleaning up all services...');
    
    try {
      cleanupService.cleanup();
      notificationService.cleanup();
      this.isInitialized = false;
      console.log('✅ All services cleaned up successfully');
    } catch (error) {
      console.error('Error cleaning up services:', error);
    }
  }

  // Get initialization status
  getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  // Manual reinitialization
  async reinitialize(): Promise<void> {
    console.log('Reinitializing services...');
    this.cleanupServices();
    await this.initializeServices();
  }
}

export const serviceInitializer = new ServiceInitializer();
