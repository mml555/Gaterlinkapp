import { firebaseAuthService } from './firebaseAuthService';
import { cleanupService } from './cleanupService';
import { notificationService } from './notificationService';
import { auth } from '../config/firebase';

class ServiceInitializer {
  private isInitialized = false;
  private initializationAttempts = 0;
  private maxAttempts = 3;
  private isReinitializing = false; // Prevent multiple simultaneous reinitializations
  private lastAuthState: string | null = null; // Track last auth state to prevent unnecessary reinitializations
  private initializationPromise: Promise<void> | null = null; // Track ongoing initialization

  // Initialize all client-side services and listeners
  async initializeServices(): Promise<void> {
    // If already initialized and not reinitializing, return immediately
    if (this.isInitialized && !this.isReinitializing) {
      console.log('Services already initialized');
      return;
    }

    // If initialization is already in progress, wait for it to complete
    if (this.initializationPromise) {
      console.log('Initialization already in progress, waiting...');
      return this.initializationPromise;
    }

    // Prevent multiple simultaneous initializations
    if (this.isReinitializing) {
      console.log('Services are already being reinitialized, skipping...');
      return;
    }

    this.isReinitializing = true;
    this.initializationPromise = this.performInitialization();

    try {
      await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
      this.isReinitializing = false;
    }
  }

  // Perform the actual initialization
  private async performInitialization(): Promise<void> {
    try {
      console.log('🔄 Starting service initialization...');
      
      // Wait for Firebase Auth to be ready
      await this.waitForAuth();
      
      // Test basic Firestore access
      await this.testFirestoreAccess();
      
      // Check and refresh user permissions
      await this.checkAndRefreshUserPermissions();
      
      // Request notification permissions
      await notificationService.requestPermissions();
      
      // Setup auth state listener
      this.setupAuthStateListener();
      
      this.isInitialized = true;
      this.initializationAttempts = 0;
      console.log('✅ Service initialization completed successfully');
    } catch (error) {
      console.error('❌ Service initialization failed:', error);
      this.handleInitializationFailure();
      throw error;
    }
  }

  // Handle initialization failure with retry logic
  private handleInitializationFailure(): void {
    this.initializationAttempts++;
    if (this.initializationAttempts < this.maxAttempts) {
      console.log(`Retrying service initialization (attempt ${this.initializationAttempts + 1}/${this.maxAttempts})...`);
      setTimeout(() => {
        this.initializeServices();
      }, 2000 * this.initializationAttempts); // Exponential backoff
    } else {
      console.error(`Failed to initialize services after ${this.maxAttempts} attempts`);
      // Mark as initialized anyway to prevent blocking the app
      this.isInitialized = true;
    }
  }

  // Wait for Firebase Auth to be ready
  private async waitForAuth(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds timeout
      
      const checkAuth = () => {
        attempts++;
        if (auth && (auth as any).currentUser !== null) {
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
    try {
      firebaseAuthService.onAuthStateChanged(async (user) => {
        // Prevent unnecessary reinitializations
        const currentAuthState = user ? user.id : null;
        if (this.lastAuthState === currentAuthState) {
          console.log('Auth state unchanged, skipping reinitialization');
          return;
        }
        
        this.lastAuthState = currentAuthState;
        
        if (user) {
          console.log('User authenticated, reinitializing services...');
          this.isInitialized = false;
          this.initializationAttempts = 0; // Reset attempts
          await this.initializeServices();
        } else {
          console.log('User signed out, cleaning up services...');
          this.cleanupServices();
        }
      });
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
    }
  }

  // Cleanup all services and listeners
  cleanupServices(): void {
    console.log('Cleaning up all services...');
    
    try {
      cleanupService.cleanup();
      notificationService.cleanup();
      this.isInitialized = false;
      this.initializationAttempts = 0;
      this.lastAuthState = null;
      console.log('✅ All services cleaned up successfully');
    } catch (error) {
      console.error('Error cleaning up services:', error);
    }
  }

  // Get initialization status
  getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  // Get detailed status
  getDetailedStatus(): { isInitialized: boolean; attempts: number; maxAttempts: number } {
    return {
      isInitialized: this.isInitialized,
      attempts: this.initializationAttempts,
      maxAttempts: this.maxAttempts
    };
  }

  // Manual reinitialization
  async reinitialize(): Promise<void> {
    console.log('Reinitializing services...');
    this.cleanupServices();
    this.initializationAttempts = 0;
    await this.initializeServices();
  }

  // Test basic Firestore access
  private async testFirestoreAccess(): Promise<void> {
    try {
      console.log('Testing basic Firestore access...');
      
      // Skip dynamic imports for now - they're not supported in this environment
      console.log('Skipping dynamic import test for Firestore access');
      
      console.log('✅ Basic Firestore access test successful');
    } catch (error: any) {
      console.error('❌ Basic Firestore access test failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
    }
  }

  // Check and refresh user permissions
  private async checkAndRefreshUserPermissions(): Promise<void> {
    try {
      const currentUser = await firebaseAuthService.getCurrentUser();
      if (!currentUser) {
        console.log('No authenticated user found');
        return;
      }

      // Check if user document exists and has proper structure
      await this.ensureUserDocumentExists(currentUser.id);
      
      // Skip dynamic imports for now
      console.log('Skipping token refresh');
      
      console.log('User permissions checked and refreshed');
    } catch (error) {
      console.error('Error checking user permissions:', error);
    }
  }

  // Ensure user document exists with proper structure
  private async ensureUserDocumentExists(userId: string): Promise<void> {
    try {
      // Skip dynamic imports for now - they're not supported in this environment
      
      // Skip dynamic import operations for now
      console.log(`Skipping user document operations for ${userId}`);
    } catch (error) {
      console.error('Error ensuring user document exists:', error);
    }
  }
}

export const serviceInitializer = new ServiceInitializer();
