/**
 * Utility functions for handling dates in Redux state
 * Redux requires all state to be serializable, so we convert Date objects to ISO strings
 */

import { User, UserRole, SiteMembership } from '../types';

export interface SerializableUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole; // Keep the enum type
  profilePicture?: string;
  isActive: boolean;
  createdAt: string; // ISO string instead of Date
  updatedAt: string; // ISO string instead of Date
  lastLoginAt?: string; // ISO string instead of Date
  biometricEnabled: boolean;
  notificationSettings: {
    pushEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    soundEnabled: boolean;
    badgeEnabled: boolean;
  };
  siteMemberships: SiteMembership[];
}

/**
 * Converts a User object with Date fields to a serializable format
 */
export function serializeUser(user: User): SerializableUser {
  if (!user) return user as any;
  
  return {
    ...user,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
    lastLoginAt: user.lastLoginAt instanceof Date ? user.lastLoginAt.toISOString() : user.lastLoginAt,
  };
}

/**
 * Converts a serializable user back to a User object with Date fields
 */
export function deserializeUser(user: SerializableUser): User {
  if (!user) return user as any;
  
  return {
    ...user,
    createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
    updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
    lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : undefined,
  };
}

/**
 * Recursively converts all Date objects in an object to ISO strings
 */
export function serializeDates(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(serializeDates);
  }
  
  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        serialized[key] = serializeDates(obj[key]);
      }
    }
    return serialized;
  }
  
  return obj;
}

/**
 * Recursively converts all ISO date strings back to Date objects
 */
export function deserializeDates(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
    return new Date(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(deserializeDates);
  }
  
  if (typeof obj === 'object') {
    const deserialized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        deserialized[key] = deserializeDates(obj[key]);
      }
    }
    return deserialized;
  }
  
  return obj;
}
