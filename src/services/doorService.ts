export interface Door {
  id: string;
  name: string;
  location: string;
  status: 'locked' | 'unlocked';
  accessLevel: 'admin' | 'user' | 'guest';
  lastAccess: string;
  qrCode?: string;
  nfcTag?: string;
}

export interface DoorAccess {
  id: string;
  doorId: string;
  userId: string;
  userName: string;
  timestamp: Date;
  action: 'unlock' | 'lock' | 'access_denied';
  method: 'app' | 'qr' | 'nfc' | 'biometric';
}

class DoorService {
  private doors: Door[] = [
    {
      id: '1',
      name: 'Front Door',
      location: 'Main Entrance',
      status: 'locked',
      accessLevel: 'admin',
      lastAccess: '2 min ago',
    },
    {
      id: '2',
      name: 'Back Gate',
      location: 'Garden',
      status: 'unlocked',
      accessLevel: 'user',
      lastAccess: '5 min ago',
    },
    {
      id: '3',
      name: 'Garage Door',
      location: 'Garage',
      status: 'locked',
      accessLevel: 'admin',
      lastAccess: '1 hour ago',
    },
    {
      id: '4',
      name: 'Side Entrance',
      location: 'Side Yard',
      status: 'locked',
      accessLevel: 'guest',
      lastAccess: '3 hours ago',
    },
  ];

  async getDoors(): Promise<Door[]> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.doors;
  }

  async getDoorById(id: string): Promise<Door | null> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.doors.find(door => door.id === id) || null;
  }

  async unlockDoor(doorId: string, userId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const door = this.doors.find(d => d.id === doorId);
    if (door) {
      door.status = 'unlocked';
      door.lastAccess = 'Just now';
      return true;
    }
    return false;
  }

  async lockDoor(doorId: string, userId: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const door = this.doors.find(d => d.id === doorId);
    if (door) {
      door.status = 'locked';
      door.lastAccess = 'Just now';
      return true;
    }
    return false;
  }

  async addDoor(door: Omit<Door, 'id'>): Promise<Door> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newDoor: Door = {
      ...door,
      id: Date.now().toString(),
    };
    
    this.doors.push(newDoor);
    return newDoor;
  }

  async updateDoor(id: string, updates: Partial<Door>): Promise<Door | null> {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const doorIndex = this.doors.findIndex(d => d.id === id);
    if (doorIndex !== -1) {
      this.doors[doorIndex] = { ...this.doors[doorIndex], ...updates };
      return this.doors[doorIndex];
    }
    return null;
  }

  async deleteDoor(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const doorIndex = this.doors.findIndex(d => d.id === id);
    if (doorIndex !== -1) {
      this.doors.splice(doorIndex, 1);
      return true;
    }
    return false;
  }

  async getDoorAccessLogs(doorId: string, limit: number = 50): Promise<DoorAccess[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Mock access logs
    return [
      {
        id: '1',
        doorId,
        userId: 'user1',
        userName: 'John Doe',
        timestamp: new Date(),
        action: 'unlock',
        method: 'app',
      },
      {
        id: '2',
        doorId,
        userId: 'user2',
        userName: 'Jane Smith',
        timestamp: new Date(Date.now() - 300000),
        action: 'lock',
        method: 'qr',
      },
    ];
  }

  async generateQRCode(doorId: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return `qr_code_${doorId}_${Date.now()}`;
  }

  async validateQRCode(qrCode: string): Promise<{ valid: boolean; doorId?: string }> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock QR validation
    if (qrCode.startsWith('qr_code_')) {
      const doorId = qrCode.split('_')[2];
      return { valid: true, doorId };
    }
    return { valid: false };
  }
}

export const doorService = new DoorService();
