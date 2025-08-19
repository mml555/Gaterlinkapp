import { Platform, Alert, Linking } from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  request,
  check,
  openSettings,
  Permission,
} from 'react-native-permissions';
import LoggingService from './logging.service';

class PermissionService {
  /**
   * Get platform-specific permission
   */
  private getPermission(type: 'camera' | 'notifications' | 'biometrics'): Permission | null {
    switch (type) {
      case 'camera':
        return Platform.OS === 'ios' 
          ? PERMISSIONS.IOS.CAMERA 
          : PERMISSIONS.ANDROID.CAMERA;
      
      case 'notifications':
        return Platform.OS === 'ios'
          ? PERMISSIONS.IOS.NOTIFICATIONS
          : PERMISSIONS.ANDROID.POST_NOTIFICATIONS;
      
      case 'biometrics':
        return Platform.OS === 'ios'
          ? PERMISSIONS.IOS.FACE_ID
          : null; // Android doesn't require permission for biometrics
      
      default:
        return null;
    }
  }

  /**
   * Check permission status
   */
  async checkPermission(type: 'camera' | 'notifications' | 'biometrics'): Promise<boolean> {
    try {
      const permission = this.getPermission(type);
      
      if (!permission) {
        return true; // No permission needed
      }

      const result = await check(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      LoggingService.error(`Failed to check ${type} permission`, 'Permission', error as Error);
      return false;
    }
  }

  /**
   * Request permission
   */
  async requestPermission(type: 'camera' | 'notifications' | 'biometrics'): Promise<boolean> {
    try {
      const permission = this.getPermission(type);
      
      if (!permission) {
        return true; // No permission needed
      }

      const result = await request(permission);
      
      LoggingService.info(
        `Permission ${type} request result: ${result}`,
        'Permission'
      );

      switch (result) {
        case RESULTS.GRANTED:
          return true;
        
        case RESULTS.DENIED:
          this.showPermissionDeniedAlert(type);
          return false;
        
        case RESULTS.BLOCKED:
          this.showPermissionBlockedAlert(type);
          return false;
        
        case RESULTS.UNAVAILABLE:
          Alert.alert(
            'Feature Unavailable',
            `${this.getFeatureName(type)} is not available on this device.`
          );
          return false;
        
        default:
          return false;
      }
    } catch (error) {
      LoggingService.error(`Failed to request ${type} permission`, 'Permission', error as Error);
      return false;
    }
  }

  /**
   * Show permission denied alert
   */
  private showPermissionDeniedAlert(type: 'camera' | 'notifications' | 'biometrics'): void {
    const feature = this.getFeatureName(type);
    const reason = this.getPermissionReason(type);

    Alert.alert(
      `${feature} Permission Required`,
      reason,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Try Again', onPress: () => this.requestPermission(type) },
      ]
    );
  }

  /**
   * Show permission blocked alert
   */
  private showPermissionBlockedAlert(type: 'camera' | 'notifications' | 'biometrics'): void {
    const feature = this.getFeatureName(type);
    const reason = this.getPermissionReason(type);

    Alert.alert(
      `${feature} Permission Blocked`,
      `${reason}\n\nPlease enable ${feature.toLowerCase()} access in your device settings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: openSettings },
      ]
    );
  }

  /**
   * Get feature name for display
   */
  private getFeatureName(type: 'camera' | 'notifications' | 'biometrics'): string {
    switch (type) {
      case 'camera':
        return 'Camera';
      case 'notifications':
        return 'Notifications';
      case 'biometrics':
        return Platform.OS === 'ios' ? 'Face ID' : 'Biometric';
      default:
        return 'Feature';
    }
  }

  /**
   * Get permission reason for display
   */
  private getPermissionReason(type: 'camera' | 'notifications' | 'biometrics'): string {
    switch (type) {
      case 'camera':
        return 'GaterLink needs camera access to scan QR codes for door access.';
      case 'notifications':
        return 'GaterLink needs notification access to keep you updated on request status and messages.';
      case 'biometrics':
        return 'GaterLink needs biometric access to provide secure and convenient login.';
      default:
        return 'This permission is required for the app to function properly.';
    }
  }

  /**
   * Request multiple permissions
   */
  async requestMultiplePermissions(
    types: Array<'camera' | 'notifications' | 'biometrics'>
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const type of types) {
      results[type] = await this.requestPermission(type);
    }

    return results;
  }

  /**
   * Open app settings
   */
  openAppSettings(): void {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      openSettings();
    }
  }
}

export default new PermissionService();