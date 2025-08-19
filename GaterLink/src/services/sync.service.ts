import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import DatabaseService from './database.service';
import ApiService from './api.service';
import LoggingService from './logging.service';

class SyncService {
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private readonly SYNC_INTERVAL = 30000; // 30 seconds
  private readonly MAX_RETRIES = 3;

  constructor() {
    this.initializeNetworkListener();
  }

  /**
   * Initialize network state listener
   */
  private initializeNetworkListener(): void {
    NetInfo.addEventListener(this.handleNetworkChange);
    
    // Get initial network state
    NetInfo.fetch().then(this.handleNetworkChange);
  }

  /**
   * Handle network state changes
   */
  private handleNetworkChange = (state: NetInfoState): void => {
    const wasOffline = !this.isOnline;
    this.isOnline = state.isConnected && state.isInternetReachable || false;

    LoggingService.info(
      `Network state changed: ${this.isOnline ? 'Online' : 'Offline'}`,
      'Sync',
      { type: state.type, details: state.details }
    );

    // Start sync when coming back online
    if (wasOffline && this.isOnline) {
      this.startSync();
    }
  };

  /**
   * Start automatic sync
   */
  startSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Initial sync
    this.syncAll();

    // Set up periodic sync
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncAll();
      }
    }, this.SYNC_INTERVAL);
  }

  /**
   * Stop automatic sync
   */
  stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync all pending data
   */
  async syncAll(): Promise<void> {
    if (!this.isOnline || this.isSyncing) {
      return;
    }

    this.isSyncing = true;
    LoggingService.info('Starting sync process', 'Sync');

    try {
      const queue = await DatabaseService.getOfflineQueue();
      let successCount = 0;
      let failureCount = 0;

      for (const item of queue) {
        const success = await this.syncQueueItem(item);
        
        if (success) {
          successCount++;
          await DatabaseService.removeFromOfflineQueue(item.id);
        } else {
          failureCount++;
          await DatabaseService.incrementOfflineQueueRetries(item.id);
          
          // Remove items that have exceeded max retries
          if (item.retries >= this.MAX_RETRIES) {
            await DatabaseService.removeFromOfflineQueue(item.id);
            LoggingService.error(
              `Sync failed after ${this.MAX_RETRIES} retries`,
              'Sync',
              undefined,
              item
            );
          }
        }
      }

      LoggingService.info(
        'Sync completed',
        'Sync',
        { total: queue.length, success: successCount, failed: failureCount }
      );
    } catch (error) {
      LoggingService.error('Sync process failed', 'Sync', error as Error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync a single queue item
   */
  private async syncQueueItem(item: any): Promise<boolean> {
    try {
      switch (item.entity) {
        case 'request':
          return await this.syncRequest(item.action, item.data);
        case 'door':
          return await this.syncDoor(item.action, item.data);
        case 'scan':
          return await this.syncScan(item.action, item.data);
        default:
          LoggingService.warn(`Unknown sync entity: ${item.entity}`, 'Sync');
          return false;
      }
    } catch (error) {
      LoggingService.error(
        `Failed to sync ${item.entity}`,
        'Sync',
        error as Error,
        item
      );
      return false;
    }
  }

  /**
   * Sync access request
   */
  private async syncRequest(action: string, data: any): Promise<boolean> {
    let response;

    switch (action) {
      case 'create':
        response = await ApiService.post('/api/requests', data);
        break;
      case 'update':
        response = await ApiService.patch(`/api/requests/${data.id}`, data);
        break;
      case 'delete':
        response = await ApiService.delete(`/api/requests/${data.id}`);
        break;
      default:
        return false;
    }

    return response.success;
  }

  /**
   * Sync door data
   */
  private async syncDoor(action: string, data: any): Promise<boolean> {
    let response;

    switch (action) {
      case 'create':
      case 'update':
        response = await ApiService.post('/api/doors', data);
        break;
      case 'access':
        response = await ApiService.post(`/api/doors/${data.id}/access`, {
          timestamp: data.timestamp,
        });
        break;
      default:
        return false;
    }

    return response.success;
  }

  /**
   * Sync scan history
   */
  private async syncScan(action: string, data: any): Promise<boolean> {
    const response = await ApiService.post('/api/scans', data);
    return response.success;
  }

  /**
   * Manually trigger sync
   */
  async manualSync(): Promise<boolean> {
    if (!this.isOnline) {
      LoggingService.warn('Cannot sync while offline', 'Sync');
      return false;
    }

    await this.syncAll();
    return true;
  }

  /**
   * Check if currently syncing
   */
  isSynchronizing(): boolean {
    return this.isSyncing;
  }

  /**
   * Check if online
   */
  isNetworkAvailable(): boolean {
    return this.isOnline;
  }

  /**
   * Get pending sync count
   */
  async getPendingSyncCount(): Promise<number> {
    const queue = await DatabaseService.getOfflineQueue();
    return queue.length;
  }
}

export default new SyncService();