export interface AccessRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  doorId: string;
  doorName: string;
  type: 'temporary' | 'permanent';
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  approvedBy?: string;
  duration?: string;
  reason?: string;
  notes?: string;
}

export interface RequestFilters {
  status?: 'pending' | 'approved' | 'rejected';
  type?: 'temporary' | 'permanent';
  doorId?: string;
  requesterId?: string;
  startDate?: Date;
  endDate?: Date;
}

class RequestService {
  private requests: AccessRequest[] = [
    {
      id: '1',
      requesterId: 'user1',
      requesterName: 'John Doe',
      requesterEmail: 'john.doe@example.com',
      doorId: '1',
      doorName: 'Front Door',
      type: 'temporary',
      status: 'pending',
      requestedAt: new Date(Date.now() - 7200000), // 2 hours ago
      duration: '2 hours',
      reason: 'Package delivery',
    },
    {
      id: '2',
      requesterId: 'user2',
      requesterName: 'Jane Smith',
      requesterEmail: 'jane.smith@example.com',
      doorId: '2',
      doorName: 'Back Gate',
      type: 'permanent',
      status: 'approved',
      requestedAt: new Date(Date.now() - 86400000), // 1 day ago
      approvedAt: new Date(Date.now() - 82800000), // 23 hours ago
      approvedBy: 'admin1',
      duration: 'Indefinite',
      reason: 'Regular access needed',
    },
    {
      id: '3',
      requesterId: 'user3',
      requesterName: 'Mike Johnson',
      requesterEmail: 'mike.johnson@example.com',
      doorId: '3',
      doorName: 'Garage Door',
      type: 'temporary',
      status: 'rejected',
      requestedAt: new Date(Date.now() - 259200000), // 3 days ago
      rejectedAt: new Date(Date.now() - 252000000), // 2.9 days ago
      approvedBy: 'admin1',
      duration: '1 day',
      reason: 'Vehicle maintenance',
      notes: 'Access denied due to security concerns',
    },
  ];

  async getRequests(filters?: RequestFilters): Promise<AccessRequest[]> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    let filteredRequests = [...this.requests];
    
    if (filters) {
      if (filters.status) {
        filteredRequests = filteredRequests.filter(req => req.status === filters.status);
      }
      if (filters.type) {
        filteredRequests = filteredRequests.filter(req => req.type === filters.type);
      }
      if (filters.doorId) {
        filteredRequests = filteredRequests.filter(req => req.doorId === filters.doorId);
      }
      if (filters.requesterId) {
        filteredRequests = filteredRequests.filter(req => req.requesterId === filters.requesterId);
      }
      if (filters.startDate) {
        filteredRequests = filteredRequests.filter(req => req.requestedAt >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredRequests = filteredRequests.filter(req => req.requestedAt <= filters.endDate!);
      }
    }
    
    return filteredRequests.sort((a, b) => b.requestedAt.getTime() - a.requestedAt.getTime());
  }

  async getRequestById(id: string): Promise<AccessRequest | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.requests.find(req => req.id === id) || null;
  }

  async createRequest(request: Omit<AccessRequest, 'id' | 'status' | 'requestedAt'>): Promise<AccessRequest> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newRequest: AccessRequest = {
      ...request,
      id: Date.now().toString(),
      status: 'pending',
      requestedAt: new Date(),
    };
    
    this.requests.push(newRequest);
    return newRequest;
  }

  async approveRequest(requestId: string, approvedBy: string, notes?: string): Promise<AccessRequest | null> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const requestIndex = this.requests.findIndex(req => req.id === requestId);
    if (requestIndex !== -1) {
      this.requests[requestIndex] = {
        ...this.requests[requestIndex],
        status: 'approved',
        approvedAt: new Date(),
        approvedBy,
        notes,
      };
      return this.requests[requestIndex];
    }
    return null;
  }

  async rejectRequest(requestId: string, approvedBy: string, notes?: string): Promise<AccessRequest | null> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const requestIndex = this.requests.findIndex(req => req.id === requestId);
    if (requestIndex !== -1) {
      this.requests[requestIndex] = {
        ...this.requests[requestIndex],
        status: 'rejected',
        rejectedAt: new Date(),
        approvedBy,
        notes,
      };
      return this.requests[requestIndex];
    }
    return null;
  }

  async updateRequest(id: string, updates: Partial<AccessRequest>): Promise<AccessRequest | null> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const requestIndex = this.requests.findIndex(req => req.id === id);
    if (requestIndex !== -1) {
      this.requests[requestIndex] = { ...this.requests[requestIndex], ...updates };
      return this.requests[requestIndex];
    }
    return null;
  }

  async deleteRequest(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const requestIndex = this.requests.findIndex(req => req.id === id);
    if (requestIndex !== -1) {
      this.requests.splice(requestIndex, 1);
      return true;
    }
    return false;
  }

  async getRequestStats(): Promise<{
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  }> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const pending = this.requests.filter(req => req.status === 'pending').length;
    const approved = this.requests.filter(req => req.status === 'approved').length;
    const rejected = this.requests.filter(req => req.status === 'rejected').length;
    
    return {
      pending,
      approved,
      rejected,
      total: this.requests.length,
    };
  }
}

export const requestService = new RequestService();
