import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import { Door, AccessRequest, ScanHistory } from '../types';

// Enable promise-based API
SQLite.enablePromise(true);

class DatabaseService {
  private db: SQLiteDatabase | null = null;
  private readonly dbName = 'gaterlink.db';

  /**
   * Initialize database and create tables
   */
  async init(): Promise<void> {
    try {
      this.db = await SQLite.openDatabase({
        name: this.dbName,
        location: 'default',
      });

      await this.createTables();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const queries = [
      // Doors table
      `CREATE TABLE IF NOT EXISTS doors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location TEXT NOT NULL,
        qrCode TEXT NOT NULL UNIQUE,
        lastAccessed INTEGER,
        isSaved INTEGER DEFAULT 0,
        syncStatus TEXT DEFAULT 'synced',
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      )`,

      // Requests table
      `CREATE TABLE IF NOT EXISTS requests (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        doorId TEXT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        category TEXT NOT NULL,
        adminNotes TEXT,
        syncStatus TEXT DEFAULT 'pending',
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        completedAt INTEGER,
        FOREIGN KEY (doorId) REFERENCES doors(id)
      )`,

      // Scan history table
      `CREATE TABLE IF NOT EXISTS scan_history (
        id TEXT PRIMARY KEY,
        doorId TEXT NOT NULL,
        userId TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        status TEXT NOT NULL,
        syncStatus TEXT DEFAULT 'synced',
        FOREIGN KEY (doorId) REFERENCES doors(id)
      )`,

      // Offline queue table for syncing
      `CREATE TABLE IF NOT EXISTS offline_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        retries INTEGER DEFAULT 0
      )`,
    ];

    for (const query of queries) {
      await this.db.executeSql(query);
    }
  }

  /**
   * Doors Operations
   */
  async saveDoor(door: Door): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      INSERT OR REPLACE INTO doors 
      (id, name, location, qrCode, lastAccessed, isSaved, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      door.id,
      door.name,
      door.location,
      door.qrCode,
      door.lastAccessed ? door.lastAccessed.getTime() : null,
      door.isSaved ? 1 : 0,
      new Date().getTime(),
      new Date().getTime(),
    ];

    await this.db.executeSql(query, values);
  }

  async getSavedDoors(): Promise<Door[]> {
    if (!this.db) throw new Error('Database not initialized');

    const query = 'SELECT * FROM doors WHERE isSaved = 1 ORDER BY lastAccessed DESC';
    const [result] = await this.db.executeSql(query);

    const doors: Door[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      doors.push({
        id: row.id,
        name: row.name,
        location: row.location,
        qrCode: row.qrCode,
        lastAccessed: row.lastAccessed ? new Date(row.lastAccessed) : undefined,
        isSaved: true,
      });
    }

    return doors;
  }

  async getDoorByQRCode(qrCode: string): Promise<Door | null> {
    if (!this.db) throw new Error('Database not initialized');

    const query = 'SELECT * FROM doors WHERE qrCode = ? LIMIT 1';
    const [result] = await this.db.executeSql(query, [qrCode]);

    if (result.rows.length === 0) return null;

    const row = result.rows.item(0);
    return {
      id: row.id,
      name: row.name,
      location: row.location,
      qrCode: row.qrCode,
      lastAccessed: row.lastAccessed ? new Date(row.lastAccessed) : undefined,
      isSaved: row.isSaved === 1,
    };
  }

  async updateDoorLastAccessed(doorId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = 'UPDATE doors SET lastAccessed = ?, updatedAt = ? WHERE id = ?';
    const now = new Date().getTime();
    await this.db.executeSql(query, [now, now, doorId]);
  }

  /**
   * Requests Operations
   */
  async saveRequest(request: AccessRequest): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      INSERT OR REPLACE INTO requests 
      (id, userId, doorId, name, phone, reason, status, priority, category, 
       adminNotes, createdAt, updatedAt, completedAt, syncStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      request.id,
      request.userId,
      request.doorId || null,
      request.name,
      request.phone,
      request.reason,
      request.status,
      request.priority,
      request.category,
      request.adminNotes || null,
      request.createdAt.getTime(),
      request.updatedAt.getTime(),
      request.completedAt ? request.completedAt.getTime() : null,
      'pending', // Mark as pending sync
    ];

    await this.db.executeSql(query, values);

    // Add to offline queue for syncing
    await this.addToOfflineQueue('create', 'request', request);
  }

  async getRequests(userId?: string): Promise<AccessRequest[]> {
    if (!this.db) throw new Error('Database not initialized');

    let query = 'SELECT * FROM requests';
    const params: any[] = [];

    if (userId) {
      query += ' WHERE userId = ?';
      params.push(userId);
    }

    query += ' ORDER BY createdAt DESC';

    const [result] = await this.db.executeSql(query, params);

    const requests: AccessRequest[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      requests.push({
        id: row.id,
        userId: row.userId,
        doorId: row.doorId,
        name: row.name,
        phone: row.phone,
        reason: row.reason,
        status: row.status,
        priority: row.priority,
        category: row.category,
        adminNotes: row.adminNotes,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
      });
    }

    return requests;
  }

  async updateRequestStatus(requestId: string, status: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = 'UPDATE requests SET status = ?, updatedAt = ?, syncStatus = ? WHERE id = ?';
    const now = new Date().getTime();
    await this.db.executeSql(query, [status, now, 'pending', requestId]);

    // Add to offline queue for syncing
    await this.addToOfflineQueue('update', 'request', { id: requestId, status });
  }

  /**
   * Scan History Operations
   */
  async saveScanHistory(scan: ScanHistory): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      INSERT INTO scan_history (id, doorId, userId, timestamp, status)
      VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
      scan.id,
      scan.doorId,
      scan.userId,
      scan.timestamp.getTime(),
      scan.status,
    ];

    await this.db.executeSql(query, values);
  }

  async getScanHistory(userId: string): Promise<ScanHistory[]> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      SELECT sh.*, d.name as doorName, d.location as doorLocation 
      FROM scan_history sh
      JOIN doors d ON sh.doorId = d.id
      WHERE sh.userId = ?
      ORDER BY sh.timestamp DESC
      LIMIT 50
    `;

    const [result] = await this.db.executeSql(query, [userId]);

    const history: ScanHistory[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      history.push({
        id: row.id,
        doorId: row.doorId,
        userId: row.userId,
        timestamp: new Date(row.timestamp),
        status: row.status,
      });
    }

    return history;
  }

  /**
   * Offline Queue Operations
   */
  private async addToOfflineQueue(action: string, entity: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      INSERT INTO offline_queue (action, entity, data, timestamp)
      VALUES (?, ?, ?, ?)
    `;

    const values = [
      action,
      entity,
      JSON.stringify(data),
      new Date().getTime(),
    ];

    await this.db.executeSql(query, values);
  }

  async getOfflineQueue(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const query = 'SELECT * FROM offline_queue ORDER BY timestamp ASC';
    const [result] = await this.db.executeSql(query);

    const queue: any[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      queue.push({
        id: row.id,
        action: row.action,
        entity: row.entity,
        data: JSON.parse(row.data),
        timestamp: new Date(row.timestamp),
        retries: row.retries,
      });
    }

    return queue;
  }

  async removeFromOfflineQueue(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = 'DELETE FROM offline_queue WHERE id = ?';
    await this.db.executeSql(query, [id]);
  }

  async incrementOfflineQueueRetries(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const query = 'UPDATE offline_queue SET retries = retries + 1 WHERE id = ?';
    await this.db.executeSql(query, [id]);
  }

  /**
   * Clear all local data
   */
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = ['doors', 'requests', 'scan_history', 'offline_queue'];
    
    for (const table of tables) {
      await this.db.executeSql(`DELETE FROM ${table}`);
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

export default new DatabaseService();