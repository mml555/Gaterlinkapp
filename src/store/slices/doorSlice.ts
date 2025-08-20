import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DoorState, Door } from '../../types';
import { doorService } from '../../services/doorService';

// Helper function to serialize dates in door objects
const serializeDoorDates = (door: any): any => {
  if (!door) return door;
  
  const serializeDate = (date: any): string | null => {
    if (!date) return null;
    
    // Handle Firestore Timestamp objects
    if (date && typeof date === 'object' && date.seconds) {
      return new Date(date.seconds * 1000).toISOString();
    }
    
    // Handle Date objects
    if (date instanceof Date) {
      return date.toISOString();
    }
    
    // Handle string dates
    if (typeof date === 'string') {
      return date;
    }
    
    return null;
  };
  
  return {
    ...door,
    createdAt: serializeDate(door.createdAt),
    updatedAt: serializeDate(door.updatedAt),
    lastAccessedAt: serializeDate(door.lastAccessedAt),
  };
};

// Async thunks
export const fetchDoors = createAsyncThunk(
  'doors/fetchDoors',
  async (_, { rejectWithValue }) => {
    try {
      const doors = await doorService.getDoors();
      // Serialize dates for all doors
      return doors.map(door => serializeDoorDates(door));
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch doors');
    }
  }
);

export const fetchSavedDoors = createAsyncThunk(
  'doors/fetchSavedDoors',
  async (_, { rejectWithValue }) => {
    try {
      // For now, return empty array since getSavedDoors doesn't exist
      return [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch saved doors');
    }
  }
);

export const saveDoor = createAsyncThunk(
  'doors/saveDoor',
  async (doorId: string, { rejectWithValue }) => {
    try {
      // For now, just return the door ID since saveDoor doesn't exist
      return doorId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save door');
    }
  }
);

export const removeSavedDoor = createAsyncThunk(
  'doors/removeSavedDoor',
  async (doorId: string, { rejectWithValue }) => {
    try {
      // For now, just return the door ID since removeSavedDoor doesn't exist
      return doorId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove saved door');
    }
  }
);

export const scanQRCode = createAsyncThunk(
  'doors/scanQRCode',
  async (qrCode: string, { rejectWithValue }) => {
    try {
      // Validate the QR code format
      if (!qrCode || qrCode.trim().length === 0) {
        throw new Error('Invalid QR code: Empty or invalid data');
      }

      // Validate QR code using door service
      const validation = await doorService.validateQRCode(qrCode);
      
      if (!validation.valid || !validation.doorId) {
        throw new Error('Invalid QR code: Door not found or access denied');
      }

      // Get door details
      const door = await doorService.getDoorById(validation.doorId);
      
      if (!door) {
        throw new Error('Door not found');
      }

      // Serialize dates before returning
      return serializeDoorDates(door);
    } catch (error: any) {
      console.error('QR Code scan error:', error);
      return rejectWithValue(error.message || 'Invalid QR code');
    }
  }
);

export const getDoorDetails = createAsyncThunk(
  'doors/getDoorDetails',
  async (doorId: string, { rejectWithValue }) => {
    try {
      const door = await doorService.getDoorById(doorId);
      // Serialize dates before returning
      return serializeDoorDates(door);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get door details');
    }
  }
);

// Initial state
const initialState: DoorState = {
  doors: [],
  savedDoors: [],
  isLoading: false,
  error: null,
  selectedDoor: null,
};

// Door slice
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
    clearSelectedDoor: (state) => {
      state.selectedDoor = null;
    },
    addDoorToSaved: (state, action: PayloadAction<Door>) => {
      const existingIndex = state.savedDoors.findIndex(door => door.id === action.payload.id);
      if (existingIndex === -1) {
        state.savedDoors.push(action.payload);
      }
    },
    removeDoorFromSaved: (state, action: PayloadAction<string>) => {
      state.savedDoors = state.savedDoors.filter(door => door.id !== action.payload);
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
        // Transform Door[] to include missing fields
        state.doors = action.payload.map(door => ({
          id: door.id,
          name: door.name,
          location: door.location,
          qrCode: door.qrCode || '',
          description: door.location,
          isActive: true,
          accessLevel: door.accessLevel as any,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastAccessedAt: new Date(),
          accessCount: 0,
        }));
      })
      .addCase(fetchDoors.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch saved doors
    builder
      .addCase(fetchSavedDoors.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSavedDoors.fulfilled, (state, action) => {
        state.isLoading = false;
        state.savedDoors = action.payload;
      })
      .addCase(fetchSavedDoors.rejected, (state, action) => {
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
        const doorId = action.payload;
        // Find the door in the doors array and add it to savedDoors
        const door = state.doors.find(d => d.id === doorId);
        if (door) {
          const existingIndex = state.savedDoors.findIndex(savedDoor => savedDoor.id === doorId);
          if (existingIndex === -1) {
            state.savedDoors.push(door);
          }
        }
      })
      .addCase(saveDoor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Remove saved door
    builder
      .addCase(removeSavedDoor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeSavedDoor.fulfilled, (state, action) => {
        state.isLoading = false;
        const doorId = action.payload;
        state.savedDoors = state.savedDoors.filter(door => door.id !== doorId);
      })
      .addCase(removeSavedDoor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Scan QR code
    builder
      .addCase(scanQRCode.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(scanQRCode.fulfilled, (state, action) => {
        state.isLoading = false;
        // Transform Door to include missing fields
        if (action.payload) {
          state.selectedDoor = {
            id: action.payload.id,
            name: action.payload.name,
            location: action.payload.location,
            qrCode: action.payload.qrCode || '',
            description: action.payload.location,
            isActive: true,
            accessLevel: action.payload.accessLevel as any,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastAccessedAt: new Date(),
            accessCount: 0,
          };
        } else {
          state.selectedDoor = null;
        }
      })
      .addCase(scanQRCode.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get door details
    builder
      .addCase(getDoorDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getDoorDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        // Transform Door to include missing fields
        if (action.payload) {
          state.selectedDoor = {
            id: action.payload.id,
            name: action.payload.name,
            location: action.payload.location,
            qrCode: action.payload.qrCode || '',
            description: action.payload.location,
            isActive: true,
            accessLevel: action.payload.accessLevel as any,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastAccessedAt: new Date(),
            accessCount: 0,
          };
        } else {
          state.selectedDoor = null;
        }
      })
      .addCase(getDoorDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  setSelectedDoor, 
  clearSelectedDoor, 
  addDoorToSaved, 
  removeDoorFromSaved 
} = doorSlice.actions;

export default doorSlice.reducer;
