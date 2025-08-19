import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking, Alert } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import CodePush from 'react-native-code-push';
import LoggingService from './logging.service';
import { STORAGE_KEYS, API_CONFIG } from '../constants';

interface UpdateInfo {
  version: string;
  releaseNotes: string;
  mandatoryUpdate: boolean;
  minimumVersion?: string;
  downloadUrl?: string;
  releaseDate: Date;
}

interface UpdateCheckResult {
  updateAvailable: boolean;
  updateInfo?: UpdateInfo;
  currentVersion: string;
}

class UpdateService {
  private currentVersion: string;
  private lastUpdateCheck: Date | null = null;
  private readonly UPDATE_CHECK_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

  constructor() {
    this.currentVersion = DeviceInfo.getVersion();
  }

  /**
   * Check for app updates
   */
  async checkForUpdates(forceCheck: boolean = false): Promise<UpdateCheckResult> {
    try {
      // Check if we should skip the check
      if (!forceCheck && this.lastUpdateCheck) {
        const timeSinceLastCheck = Date.now() - this.lastUpdateCheck.getTime();
        if (timeSinceLastCheck < this.UPDATE_CHECK_INTERVAL) {
          LoggingService.info('Skipping update check - too recent', 'UpdateService');
          return {
            updateAvailable: false,
            currentVersion: this.currentVersion,
          };
        }
      }

      this.lastUpdateCheck = new Date();

      // Check for CodePush updates first
      const codePushUpdate = await this.checkCodePushUpdate();
      if (codePushUpdate.updateAvailable) {
        return codePushUpdate;
      }

      // Check for store updates
      const storeUpdate = await this.checkStoreUpdate();
      return storeUpdate;
    } catch (error) {
      LoggingService.error('Failed to check for updates', 'UpdateService', error as Error);
      return {
        updateAvailable: false,
        currentVersion: this.currentVersion,
      };
    }
  }

  /**
   * Check for CodePush updates
   */
  private async checkCodePushUpdate(): Promise<UpdateCheckResult> {
    try {
      const update = await CodePush.checkForUpdate();
      
      if (update) {
        const updateInfo: UpdateInfo = {
          version: update.label || 'Unknown',
          releaseNotes: update.description || 'Bug fixes and improvements',
          mandatoryUpdate: update.isMandatory,
          releaseDate: new Date(),
        };

        LoggingService.info('CodePush update available', 'UpdateService', updateInfo);

        return {
          updateAvailable: true,
          updateInfo,
          currentVersion: this.currentVersion,
        };
      }

      return {
        updateAvailable: false,
        currentVersion: this.currentVersion,
      };
    } catch (error) {
      LoggingService.error('CodePush check failed', 'UpdateService', error as Error);
      return {
        updateAvailable: false,
        currentVersion: this.currentVersion,
      };
    }
  }

  /**
   * Check for store updates
   */
  private async checkStoreUpdate(): Promise<UpdateCheckResult> {
    try {
      // Make API call to check for updates
      const response = await fetch(`${API_CONFIG.BASE_URL}/app/check-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: Platform.OS,
          currentVersion: this.currentVersion,
          buildNumber: DeviceInfo.getBuildNumber(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check for updates');
      }

      const data = await response.json();

      if (data.updateAvailable) {
        const updateInfo: UpdateInfo = {
          version: data.latestVersion,
          releaseNotes: data.releaseNotes,
          mandatoryUpdate: this.isVersionLower(this.currentVersion, data.minimumVersion),
          minimumVersion: data.minimumVersion,
          downloadUrl: data.downloadUrl,
          releaseDate: new Date(data.releaseDate),
        };

        await this.saveUpdateInfo(updateInfo);

        return {
          updateAvailable: true,
          updateInfo,
          currentVersion: this.currentVersion,
        };
      }

      return {
        updateAvailable: false,
        currentVersion: this.currentVersion,
      };
    } catch (error) {
      LoggingService.error('Store update check failed', 'UpdateService', error as Error);
      return {
        updateAvailable: false,
        currentVersion: this.currentVersion,
      };
    }
  }

  /**
   * Download and install CodePush update
   */
  async downloadCodePushUpdate(
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const update = await CodePush.checkForUpdate();
      
      if (!update) {
        return { success: false, error: 'No update available' };
      }

      await update.download((progress) => {
        const percentage = (progress.receivedBytes / progress.totalBytes) * 100;
        onProgress?.(percentage);
        LoggingService.info(`Download progress: ${percentage.toFixed(0)}%`, 'UpdateService');
      });

      // Install update
      await update.install(
        update.isMandatory 
          ? CodePush.InstallMode.IMMEDIATE 
          : CodePush.InstallMode.ON_NEXT_RESTART
      );

      LoggingService.info('CodePush update installed successfully', 'UpdateService');
      return { success: true };
    } catch (error) {
      LoggingService.error('CodePush update failed', 'UpdateService', error as Error);
      return { success: false, error: 'Failed to install update' };
    }
  }

  /**
   * Open app store for manual update
   */
  async openAppStore(): Promise<void> {
    try {
      const storeUrl = Platform.select({
        ios: `https://apps.apple.com/app/id${API_CONFIG.APP_STORE_ID}`,
        android: `https://play.google.com/store/apps/details?id=${API_CONFIG.BUNDLE_ID}`,
      });

      if (storeUrl) {
        await Linking.openURL(storeUrl);
      }
    } catch (error) {
      LoggingService.error('Failed to open app store', 'UpdateService', error as Error);
      Alert.alert('Error', 'Unable to open app store. Please update manually.');
    }
  }

  /**
   * Show update dialog
   */
  showUpdateDialog(updateInfo: UpdateInfo): void {
    const { version, releaseNotes, mandatoryUpdate } = updateInfo;
    
    const buttons = mandatoryUpdate
      ? [{ text: 'Update Now', onPress: () => this.handleUpdate(updateInfo) }]
      : [
          { text: 'Later', style: 'cancel' as const },
          { text: 'Update', onPress: () => this.handleUpdate(updateInfo) },
        ];

    Alert.alert(
      `Update Available (v${version})`,
      releaseNotes,
      buttons,
      { cancelable: !mandatoryUpdate }
    );
  }

  /**
   * Handle update based on type
   */
  private async handleUpdate(updateInfo: UpdateInfo): Promise<void> {
    if (updateInfo.downloadUrl) {
      // Store update - open app store
      await this.openAppStore();
    } else {
      // CodePush update - download and install
      Alert.alert(
        'Downloading Update',
        'The update will be downloaded in the background.',
        [{ text: 'OK' }]
      );
      
      const result = await this.downloadCodePushUpdate((progress) => {
        // You could show a progress indicator here
        console.log(`Download progress: ${progress}%`);
      });

      if (result.success) {
        Alert.alert(
          'Update Complete',
          'The app will restart to apply the update.',
          [{ text: 'Restart', onPress: () => CodePush.restartApp() }]
        );
      } else {
        Alert.alert('Update Failed', result.error || 'Please try again later.');
      }
    }
  }

  /**
   * Compare versions
   */
  private isVersionLower(current: string, minimum: string): boolean {
    const currentParts = current.split('.').map(Number);
    const minimumParts = minimum.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, minimumParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const minimumPart = minimumParts[i] || 0;

      if (currentPart < minimumPart) return true;
      if (currentPart > minimumPart) return false;
    }

    return false;
  }

  /**
   * Save update info
   */
  private async saveUpdateInfo(updateInfo: UpdateInfo): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.LAST_UPDATE_INFO,
        JSON.stringify(updateInfo)
      );
    } catch (error) {
      LoggingService.error('Failed to save update info', 'UpdateService', error as Error);
    }
  }

  /**
   * Get last update info
   */
  async getLastUpdateInfo(): Promise<UpdateInfo | null> {
    try {
      const info = await AsyncStorage.getItem(STORAGE_KEYS.LAST_UPDATE_INFO);
      return info ? JSON.parse(info) : null;
    } catch (error) {
      LoggingService.error('Failed to get update info', 'UpdateService', error as Error);
      return null;
    }
  }

  /**
   * Clear update info
   */
  async clearUpdateInfo(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.LAST_UPDATE_INFO);
    } catch (error) {
      LoggingService.error('Failed to clear update info', 'UpdateService', error as Error);
    }
  }

  /**
   * Get update history
   */
  async getUpdateHistory(): Promise<Array<{
    version: string;
    installedAt: Date;
    releaseNotes?: string;
  }>> {
    try {
      const history = await AsyncStorage.getItem(STORAGE_KEYS.UPDATE_HISTORY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      LoggingService.error('Failed to get update history', 'UpdateService', error as Error);
      return [];
    }
  }

  /**
   * Record update installation
   */
  async recordUpdateInstallation(version: string, releaseNotes?: string): Promise<void> {
    try {
      const history = await this.getUpdateHistory();
      history.push({
        version,
        installedAt: new Date(),
        releaseNotes,
      });

      // Keep only last 10 updates
      const recentHistory = history.slice(-10);
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.UPDATE_HISTORY,
        JSON.stringify(recentHistory)
      );
    } catch (error) {
      LoggingService.error('Failed to record update', 'UpdateService', error as Error);
    }
  }
}

export default new UpdateService();