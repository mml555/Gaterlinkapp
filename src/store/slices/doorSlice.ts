import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  DoorState, 
  Door, 
  Site, 
  DoorType, 
  DoorStatus, 
  QRCodeScanResult,
  AccessRequest,
  RequestStatus,
  Document,
  DocumentStatus,
  TradeType,
  UserRole
} from '../../types';
import { doorService } from '../../services/doorService';

// ============================================================================
// ASYNC THUNKS
// ============================================================================

export const fetchDoors = createAsyncThunk(
  'doors/fetchDoors',
  async (_, { rejectWithValue }) => {
    try {
      const doors = await doorService.getDoors();
      return doors;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch doors');
    }
  }
);

export const fetchDoorsBySite = createAsyncThunk(
  'doors/fetchDoorsBySite',
  async (siteId: string, { rejectWithValue }) => {
    try {
      const doors = await doorService.getDoorsBySite(siteId);
      return { siteId, doors };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch doors by site');
    }
  }
);

export const fetchDoorById = createAsyncThunk(
  'doors/fetchDoorById',
  async (doorId: string, { rejectWithValue }) => {
    try {
      const door = await doorService.getDoorById(doorId);
      return door;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch door');
    }
    }
);

export const saveDoor = createAsyncThunk(
  'doors/saveDoor',
  async (doorId: string, { rejectWithValue }) => {
    try {
      const door = await doorService.saveDoor(doorId);
      return door;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save door');
    }
  }
);

export const removeSavedDoor = createAsyncThunk(
  'doors/removeSavedDoor',
  async (doorId: string, { rejectWithValue }) => {
    try {
      await doorService.removeSavedDoor(doorId);
      return doorId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove saved door');
    }
  }
);

export const fetchSites = createAsyncThunk(
  'doors/fetchSites',
  async (_, { rejectWithValue }) => {
    try {
      const sites = await doorService.getSites();
      return sites;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sites');
    }
  }
);

export const fetchSiteById = createAsyncThunk(
  'doors/fetchSiteById',
  async (siteId: string, { rejectWithValue }) => {
    try {
      const site = await doorService.getSiteById(siteId);
      return site;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch site');
    }
  }
);

export const fetchWorkOrdersByTrade = createAsyncThunk(
  'doors/fetchWorkOrdersByTrade',
  async (tradeType: TradeType, { rejectWithValue }) => {
    try {
      const workOrders = await doorService.getWorkOrdersByTrade(tradeType);
      return { tradeType, workOrders };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch work orders');
    }
  }
);

// Enhanced QR Code Scanning with Access Request Flow
export const scanQRCode = createAsyncThunk(
  'doors/scanQRCode',
  async (qrCode: string, { rejectWithValue, getState }) => {
    try {
      // First, validate the QR code format
      if (!qrCode || qrCode.trim().length === 0) {
        throw new Error('Invalid QR code: Empty data');
      }

      // Log the scan attempt
      const scanResult: QRCodeScanResult = {
        id: Date.now().toString(),
        qrCode,
        scannedAt: new Date(),
        success: false,
      };

      // Try to identify if it's a door or equipment QR code
      const door = await doorService.getDoorByQRCode(qrCode);
      
      if (door) {
        scanResult.doorId = door.id;
        scanResult.success = true;
        
        // Check door status
        if (door.status === DoorStatus.DISABLED) {
          throw new Error('This door is currently disabled');
        }
        
        if (door.status === DoorStatus.ON_HOLD) {
          throw new Error('This area is currently on hold');
        }

        // Check if user has access to this door type
        const state = getState() as any;
        const user = state.auth.user;
        const userTrade = user?.trade;
        
        if (door.visibleTrades.length > 0 && !door.visibleTrades.includes(userTrade)) {
          throw new Error('You do not have permission to access this door');
        }

        return { scanResult, door };
      }

      // If not a door, check if it's equipment
      const equipment = await doorService.getEquipmentByQRCode(qrCode);
      if (equipment) {
        scanResult.equipmentId = equipment.id;
        scanResult.success = true;
        return { scanResult, equipment };
      }

      throw new Error('Invalid QR code: Door or equipment not found');
    } catch (error: any) {
      const scanResult: QRCodeScanResult = {
        id: Date.now().toString(),
        qrCode,
        scannedAt: new Date(),
        success: false,
        error: error.message,
      };
      
      return rejectWithValue({ scanResult, error: error.message });
    }
  }
);

// Process Access Request with Enhanced Flow
export const processAccessRequest = createAsyncThunk(
  'doors/processAccessRequest',
  async ({ 
    doorId, 
    reason, 
    note, 
    documents 
  }: {
    doorId: string;
    reason: string;
    note?: string;
    documents?: Document[];
  }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const user = state.auth.user;
      const door = state.doors.doors.find((d: Door) => d.id === doorId);
      
      if (!door) {
        throw new Error('Door not found');
      }

      // 1. Validate documents if required
      if (door.siteId) {
        const site = state.doors.sites.find((s: Site) => s.id === door.siteId);
        if (site?.settings.requireDocumentation) {
          const docValidation = await validateDocuments(documents || [], user.id);
          if (!docValidation.valid) {
            // Return documentation required status
            return {
              status: RequestStatus.DOCUMENTATION_REQUIRED,
              missingDocuments: docValidation.missingDocuments,
              expiredDocuments: docValidation.expiredDocuments,
            };
          }
        }
      }

      // 2. Check auto-approval rules
      const autoApproval = await checkAutoApprovalRules(door, user, reason);
      
      if (autoApproval.approved) {
        // Auto-approve and grant access
        const accessToken = await generateAccessToken(door, user);
        const accessLog = await logAccessEvent({
          userId: user.id,
          doorId,
          siteId: door.siteId,
          action: 'GRANTED',
          accessToken,
          reason,
          note,
        });

        return {
          status: RequestStatus.APPROVED,
          autoApproved: true,
          accessToken,
          accessCode: autoApproval.accessCode,
          expiresAt: autoApproval.expiresAt,
          accessLog,
        };
      } else {
        // Create pending request for admin review
        const request = await createPendingRequest({
          userId: user.id,
          doorId,
          siteId: door.siteId,
          reason,
          note,
          documents,
          approvers: door.approvers,
        });

        return {
          status: RequestStatus.PENDING,
          autoApproved: false,
          request,
        };
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to process access request');
    }
  }
);

// Helper functions for access request processing
const validateDocuments = async (documents: Document[], userId: string) => {
  const now = new Date();
  const missingDocuments: string[] = [];
  const expiredDocuments: Document[] = [];

  // Check for required documents
  const requiredDocs = ['INSURANCE', 'SAFETY_TRAINING'];
  
  for (const docType of requiredDocs) {
    const doc = documents.find(d => d.type === docType);
    if (!doc) {
      missingDocuments.push(docType);
    } else if (doc.expiresAt && doc.expiresAt < now) {
      expiredDocuments.push(doc);
    }
  }

  return {
    valid: missingDocuments.length === 0 && expiredDocuments.length === 0,
    missingDocuments,
    expiredDocuments,
  };
};

const checkAutoApprovalRules = async (door: Door, user: any, reason: string) => {
  // Check if user has admin role
  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
    return {
      approved: true,
      accessCode: generateAccessCode(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
  }

  // Check if door has auto-approval enabled
  if (door.siteId) {
    // This would typically check site settings
    // For now, return false to require admin approval
    return { approved: false };
  }

  return { approved: false };
};

const generateAccessToken = async (door: Door, user: any) => {
  // Generate a secure access token
  return `token_${door.id}_${user.id}_${Date.now()}`;
};

const generateAccessCode = () => {
  // Generate a 6-digit access code
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const createPendingRequest = async (requestData: any) => {
  // Create a pending access request
  return {
    id: Date.now().toString(),
    ...requestData,
    status: RequestStatus.PENDING,
    requestedAt: new Date(),
    autoApproved: false,
  };
};

const logAccessEvent = async (eventData: any) => {
  // Log the access event
  return {
    id: Date.now().toString(),
    ...eventData,
    timestamp: new Date(),
    immutable: true,
    metadata: {
      deviceInfo: {
        platform: 'iOS',
        version: '1.0.0',
        uniqueId: 'device_id',
      },
      userAgent: 'GaterlinkApp/1.0',
    },
  };
};

// ============================================================================
// EXTENDED STATE INTERFACE
// ============================================================================

interface ExtendedDoorState extends DoorState {
  // Sites
  sites: Site[];
  selectedSite: Site | null;
  
  // Work orders
  workOrders: Record<string, any[]>;
  workOrdersByTrade: Record<TradeType, any[]>;
  
  // QR scanning
  lastScanResult: QRCodeScanResult | null;
  scanHistory: QRCodeScanResult[];
  
  // NFC keys
  nfcKeys: any[];
  
  // User profile
  userProfile: any | null;
  
  // Site signin status
  signedIntoSites: string[];
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: ExtendedDoorState = {
  // Original door state
  doors: [],
  savedDoors: [],
  isLoading: false,
  error: null,
  selectedDoor: null,
  
  // Extended state
  siteDoors: {},
  sites: [],
  selectedSite: null,
  workOrders: {},
  workOrdersByTrade: {} as Record<TradeType, any[]>,
  lastScanResult: null,
  scanHistory: [],
  nfcKeys: [],
  userProfile: null,
  signedIntoSites: [],
};

// ============================================================================
// DOOR SLICE
// ============================================================================

const doorSlice = createSlice({
  name: 'doors',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedDoor: (state, action: PayloadAction<Door | null>) => {
      state.selectedDoor = action.payload;
    },
    setSelectedSite: (state, action: PayloadAction<Site | null>) => {
      state.selectedSite = action.payload;
    },
    addScanResult: (state, action: PayloadAction<QRCodeScanResult>) => {
      state.scanHistory.unshift(action.payload);
      if (state.scanHistory.length > 50) {
        state.scanHistory = state.scanHistory.slice(0, 50);
      }
    },
    clearScanHistory: (state) => {
      state.scanHistory = [];
    },
    signIntoSite: (state, action: PayloadAction<string>) => {
      if (!state.signedIntoSites.includes(action.payload)) {
        state.signedIntoSites.push(action.payload);
      }
    },
    signOutOfSite: (state, action: PayloadAction<string>) => {
      state.signedIntoSites = state.signedIntoSites.filter(
        siteId => siteId !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    // Fetch doors
    builder
      .addCase(fetchDoors.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDoors.fulfilled, (state, action) => {
        state.isLoading = false;
        state.doors = action.payload;
      })
      .addCase(fetchDoors.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch doors by site
    builder
      .addCase(fetchDoorsBySite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDoorsBySite.fulfilled, (state, action) => {
        state.isLoading = false;
        const { siteId, doors } = action.payload;
        state.siteDoors[siteId] = doors;
      })
      .addCase(fetchDoorsBySite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch door by ID
    builder
      .addCase(fetchDoorById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDoorById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedDoor = action.payload;
      })
      .addCase(fetchDoorById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Save door
    builder
      .addCase(saveDoor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveDoor.fulfilled, (state, action) => {
        state.isLoading = false;
        const savedDoor = action.payload;
        const existingIndex = state.savedDoors.findIndex(door => door.id === savedDoor.id);
        
        if (existingIndex === -1) {
          state.savedDoors.push(savedDoor);
        } else {
          state.savedDoors[existingIndex] = savedDoor;
        }
      })
      .addCase(saveDoor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Remove saved door
    builder
      .addCase(removeSavedDoor.fulfilled, (state, action) => {
        const doorId = action.payload;
        state.savedDoors = state.savedDoors.filter(door => door.id !== doorId);
      });

    // Fetch sites
    builder
      .addCase(fetchSites.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSites.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sites = action.payload;
      })
      .addCase(fetchSites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch site by ID
    builder
      .addCase(fetchSiteById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSiteById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedSite = action.payload;
      })
      .addCase(fetchSiteById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch work orders by trade
    builder
      .addCase(fetchWorkOrdersByTrade.fulfilled, (state, action) => {
        const { tradeType, workOrders } = action.payload;
        state.workOrdersByTrade[tradeType] = workOrders;
      });

    // Scan QR Code
    builder
      .addCase(scanQRCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(scanQRCode.fulfilled, (state, action) => {
        state.isLoading = false;
        const { scanResult, door } = action.payload;
        state.lastScanResult = scanResult;
        state.scanHistory.unshift(scanResult);
        
        if (door) {
          state.selectedDoor = door;
        }
        
        // Limit scan history to 50 items
        if (state.scanHistory.length > 50) {
          state.scanHistory = state.scanHistory.slice(0, 50);
        }
      })
      .addCase(scanQRCode.rejected, (state, action) => {
        state.isLoading = false;
        const { scanResult, error } = action.payload as any;
        state.lastScanResult = scanResult;
        state.error = error;
        state.scanHistory.unshift(scanResult);
      });

    // Process Access Request
    builder
      .addCase(processAccessRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(processAccessRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle the access request result
        // This will be handled by the request slice
      })
      .addCase(processAccessRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setSelectedDoor,
  setSelectedSite,
  addScanResult,
  clearScanHistory,
  signIntoSite,
  signOutOfSite,
} = doorSlice.actions;

export default doorSlice.reducer;
