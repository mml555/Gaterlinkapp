import firestore from '@react-native-firebase/firestore';
import { 
  startOfDay, 
  endOfDay, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  subDays,
  format,
} from 'date-fns';
import { AccessRequest, Door, ScanHistory } from '../types';
import { REQUEST_STATUS, REQUEST_PRIORITY, REQUEST_CATEGORY } from '../constants';
import DatabaseService from './database.service';
import ApiService from './api.service';
import LoggingService from './logging.service';

export interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  cancelledRequests: number;
  totalUsers: number;
  activeUsers: number;
  totalDoors: number;
  totalScans: number;
  averageResponseTime: number;
  averageCompletionTime: number;
  requestsByCategory: Record<string, number>;
  requestsByPriority: Record<string, number>;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface RequestAnalytics {
  daily: TimeSeriesData[];
  weekly: TimeSeriesData[];
  monthly: TimeSeriesData[];
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  averageResponseTime: number;
  averageCompletionTime: number;
  peakHours: Record<number, number>;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersByRole: Record<string, number>;
  topUsers: Array<{ userId: string; name: string; requestCount: number }>;
}

export interface DoorAnalytics {
  totalDoors: number;
  totalScans: number;
  scansToday: number;
  scansThisWeek: number;
  scansThisMonth: number;
  topDoors: Array<{ door: Door; scanCount: number }>;
  scansByHour: Record<number, number>;
  successRate: number;
}

class AnalyticsService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get from local database first
      const requests = await DatabaseService.getRequests();
      
      // Calculate stats
      const stats: DashboardStats = {
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => r.status === REQUEST_STATUS.PENDING).length,
        inProgressRequests: requests.filter(r => r.status === REQUEST_STATUS.IN_PROGRESS).length,
        completedRequests: requests.filter(r => r.status === REQUEST_STATUS.COMPLETED).length,
        cancelledRequests: requests.filter(r => r.status === REQUEST_STATUS.CANCELLED).length,
        totalUsers: 0, // Will be fetched from API
        activeUsers: 0, // Will be fetched from API
        totalDoors: (await DatabaseService.getSavedDoors()).length,
        totalScans: 0, // Will be calculated
        averageResponseTime: this.calculateAverageResponseTime(requests),
        averageCompletionTime: this.calculateAverageCompletionTime(requests),
        requestsByCategory: this.groupByCategory(requests),
        requestsByPriority: this.groupByPriority(requests),
      };

      // Fetch additional stats from API if online
      try {
        const response = await ApiService.get<any>('/api/analytics/dashboard');
        if (response.success && response.data) {
          stats.totalUsers = response.data.totalUsers || stats.totalUsers;
          stats.activeUsers = response.data.activeUsers || stats.activeUsers;
          stats.totalScans = response.data.totalScans || stats.totalScans;
        }
      } catch (error) {
        LoggingService.warn('Failed to fetch online stats', 'Analytics');
      }

      return stats;
    } catch (error) {
      LoggingService.error('Failed to get dashboard stats', 'Analytics', error as Error);
      throw error;
    }
  }

  /**
   * Get request analytics
   */
  async getRequestAnalytics(dateRange: 'week' | 'month' | 'year' = 'month'): Promise<RequestAnalytics> {
    try {
      const requests = await DatabaseService.getRequests();
      const now = new Date();
      
      let startDate: Date;
      switch (dateRange) {
        case 'week':
          startDate = subDays(now, 7);
          break;
        case 'month':
          startDate = subDays(now, 30);
          break;
        case 'year':
          startDate = subDays(now, 365);
          break;
      }

      // Filter requests within date range
      const filteredRequests = requests.filter(r => 
        new Date(r.createdAt) >= startDate
      );

      // Calculate time series data
      const daily = this.calculateDailyTimeSeries(filteredRequests, 7);
      const weekly = this.calculateWeeklyTimeSeries(filteredRequests, 4);
      const monthly = this.calculateMonthlyTimeSeries(filteredRequests, 12);

      // Calculate peak hours
      const peakHours = this.calculatePeakHours(filteredRequests);

      return {
        daily,
        weekly,
        monthly,
        byStatus: this.groupByStatus(filteredRequests),
        byCategory: this.groupByCategory(filteredRequests),
        byPriority: this.groupByPriority(filteredRequests),
        averageResponseTime: this.calculateAverageResponseTime(filteredRequests),
        averageCompletionTime: this.calculateAverageCompletionTime(filteredRequests),
        peakHours,
      };
    } catch (error) {
      LoggingService.error('Failed to get request analytics', 'Analytics', error as Error);
      throw error;
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(): Promise<UserAnalytics> {
    try {
      const response = await ApiService.get<UserAnalytics>('/api/analytics/users');
      
      if (response.success && response.data) {
        return response.data;
      }

      // Return default values if API fails
      return {
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        newUsersThisWeek: 0,
        newUsersThisMonth: 0,
        usersByRole: { customer: 0, admin: 0 },
        topUsers: [],
      };
    } catch (error) {
      LoggingService.error('Failed to get user analytics', 'Analytics', error as Error);
      throw error;
    }
  }

  /**
   * Get door analytics
   */
  async getDoorAnalytics(): Promise<DoorAnalytics> {
    try {
      const doors = await DatabaseService.getSavedDoors();
      const scanHistory: ScanHistory[] = []; // TODO: Get from database
      
      const now = new Date();
      const todayStart = startOfDay(now);
      const weekStart = startOfWeek(now);
      const monthStart = startOfMonth(now);

      // Calculate scan counts
      const scansToday = scanHistory.filter(s => 
        new Date(s.timestamp) >= todayStart
      ).length;
      
      const scansThisWeek = scanHistory.filter(s => 
        new Date(s.timestamp) >= weekStart
      ).length;
      
      const scansThisMonth = scanHistory.filter(s => 
        new Date(s.timestamp) >= monthStart
      ).length;

      // Calculate top doors
      const doorScanCounts = new Map<string, number>();
      scanHistory.forEach(scan => {
        const count = doorScanCounts.get(scan.doorId) || 0;
        doorScanCounts.set(scan.doorId, count + 1);
      });

      const topDoors = Array.from(doorScanCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([doorId, count]) => ({
          door: doors.find(d => d.id === doorId)!,
          scanCount: count,
        }))
        .filter(item => item.door);

      // Calculate scans by hour
      const scansByHour: Record<number, number> = {};
      for (let i = 0; i < 24; i++) {
        scansByHour[i] = 0;
      }
      scanHistory.forEach(scan => {
        const hour = new Date(scan.timestamp).getHours();
        scansByHour[hour]++;
      });

      // Calculate success rate
      const successfulScans = scanHistory.filter(s => s.status === 'success').length;
      const successRate = scanHistory.length > 0 
        ? (successfulScans / scanHistory.length) * 100 
        : 100;

      return {
        totalDoors: doors.length,
        totalScans: scanHistory.length,
        scansToday,
        scansThisWeek,
        scansThisMonth,
        topDoors,
        scansByHour,
        successRate,
      };
    } catch (error) {
      LoggingService.error('Failed to get door analytics', 'Analytics', error as Error);
      throw error;
    }
  }

  /**
   * Calculate average response time (time from creation to first status change)
   */
  private calculateAverageResponseTime(requests: AccessRequest[]): number {
    const responseTimes: number[] = [];
    
    requests.forEach(request => {
      if (request.status !== REQUEST_STATUS.PENDING) {
        const created = new Date(request.createdAt).getTime();
        const updated = new Date(request.updatedAt).getTime();
        const responseTime = (updated - created) / (1000 * 60); // Convert to minutes
        responseTimes.push(responseTime);
      }
    });

    if (responseTimes.length === 0) return 0;
    
    const sum = responseTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / responseTimes.length);
  }

  /**
   * Calculate average completion time
   */
  private calculateAverageCompletionTime(requests: AccessRequest[]): number {
    const completionTimes: number[] = [];
    
    requests.forEach(request => {
      if (request.status === REQUEST_STATUS.COMPLETED && request.completedAt) {
        const created = new Date(request.createdAt).getTime();
        const completed = new Date(request.completedAt).getTime();
        const completionTime = (completed - created) / (1000 * 60 * 60); // Convert to hours
        completionTimes.push(completionTime);
      }
    });

    if (completionTimes.length === 0) return 0;
    
    const sum = completionTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / completionTimes.length);
  }

  /**
   * Group requests by status
   */
  private groupByStatus(requests: AccessRequest[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    Object.values(REQUEST_STATUS).forEach(status => {
      grouped[status] = 0;
    });
    
    requests.forEach(request => {
      grouped[request.status]++;
    });
    
    return grouped;
  }

  /**
   * Group requests by category
   */
  private groupByCategory(requests: AccessRequest[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    Object.values(REQUEST_CATEGORY).forEach(category => {
      grouped[category] = 0;
    });
    
    requests.forEach(request => {
      grouped[request.category]++;
    });
    
    return grouped;
  }

  /**
   * Group requests by priority
   */
  private groupByPriority(requests: AccessRequest[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    Object.values(REQUEST_PRIORITY).forEach(priority => {
      grouped[priority] = 0;
    });
    
    requests.forEach(request => {
      grouped[request.priority]++;
    });
    
    return grouped;
  }

  /**
   * Calculate daily time series
   */
  private calculateDailyTimeSeries(requests: AccessRequest[], days: number): TimeSeriesData[] {
    const series: TimeSeriesData[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const count = requests.filter(r => {
        const created = new Date(r.createdAt);
        return created >= dayStart && created <= dayEnd;
      }).length;
      
      series.push({
        date: format(date, 'MMM d'),
        value: count,
      });
    }
    
    return series;
  }

  /**
   * Calculate weekly time series
   */
  private calculateWeeklyTimeSeries(requests: AccessRequest[], weeks: number): TimeSeriesData[] {
    const series: TimeSeriesData[] = [];
    const now = new Date();
    
    for (let i = weeks - 1; i >= 0; i--) {
      const weekEnd = subDays(now, i * 7);
      const weekStart = subDays(weekEnd, 7);
      
      const count = requests.filter(r => {
        const created = new Date(r.createdAt);
        return created >= weekStart && created <= weekEnd;
      }).length;
      
      series.push({
        date: `Week ${weeks - i}`,
        value: count,
      });
    }
    
    return series;
  }

  /**
   * Calculate monthly time series
   */
  private calculateMonthlyTimeSeries(requests: AccessRequest[], months: number): TimeSeriesData[] {
    const series: TimeSeriesData[] = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const count = requests.filter(r => {
        const created = new Date(r.createdAt);
        return created >= monthStart && created <= monthEnd;
      }).length;
      
      series.push({
        date: format(date, 'MMM'),
        value: count,
      });
    }
    
    return series;
  }

  /**
   * Calculate peak hours
   */
  private calculatePeakHours(requests: AccessRequest[]): Record<number, number> {
    const hourCounts: Record<number, number> = {};
    
    for (let i = 0; i < 24; i++) {
      hourCounts[i] = 0;
    }
    
    requests.forEach(request => {
      const hour = new Date(request.createdAt).getHours();
      hourCounts[hour]++;
    });
    
    return hourCounts;
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(type: 'csv' | 'json' = 'csv'): Promise<string> {
    try {
      const stats = await this.getDashboardStats();
      const requestAnalytics = await this.getRequestAnalytics('month');
      
      if (type === 'json') {
        return JSON.stringify({ stats, requestAnalytics }, null, 2);
      }
      
      // CSV export
      let csv = 'Metric,Value\n';
      csv += `Total Requests,${stats.totalRequests}\n`;
      csv += `Pending Requests,${stats.pendingRequests}\n`;
      csv += `In Progress Requests,${stats.inProgressRequests}\n`;
      csv += `Completed Requests,${stats.completedRequests}\n`;
      csv += `Cancelled Requests,${stats.cancelledRequests}\n`;
      csv += `Total Users,${stats.totalUsers}\n`;
      csv += `Active Users,${stats.activeUsers}\n`;
      csv += `Average Response Time,${stats.averageResponseTime} minutes\n`;
      csv += `Average Completion Time,${stats.averageCompletionTime} hours\n`;
      
      return csv;
    } catch (error) {
      LoggingService.error('Failed to export analytics', 'Analytics', error as Error);
      throw error;
    }
  }
}

export default new AnalyticsService();