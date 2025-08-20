// Performance monitoring utility for authentication operations
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  startTimer(operation: string): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.recordMetric(operation, duration);
      console.log(`⏱️ ${operation}: ${duration}ms`);
    };
  }

  private recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    this.metrics.get(operation)!.push(duration);
  }

  getAverageTime(operation: string): number {
    const times = this.metrics.get(operation);
    if (!times || times.length === 0) return 0;
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  getMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};
    this.metrics.forEach((times, operation) => {
      result[operation] = {
        average: this.getAverageTime(operation),
        count: times.length,
      };
    });
    return result;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Performance decorator for async functions
export function measurePerformance(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const stopTimer = performanceMonitor.startTimer(operation);
      try {
        const result = await method.apply(this, args);
        stopTimer();
        return result;
      } catch (error) {
        stopTimer();
        throw error;
      }
    };
  };
}
