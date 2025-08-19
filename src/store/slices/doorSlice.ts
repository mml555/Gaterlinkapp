import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DoorState, Door } from '../../types';
import { doorService } from '../../services/doorService';

// Async thunks
export const fetchDoors = createAsyncThunk(
  'doors/fetchDoors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await doorService.getDoors();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch doors');
    }
  }
);

export const fetchSavedDoors = createAsyncThunk(
  'doors/fetchSavedDoors',
  async (_, { rejectWithValue }) => {
    try {
      const response = await doorService.getSavedDoors();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch saved doors');
    }
  }
);

export const saveDoor = createAsyncThunk(
  'doors/saveDoor',
  async (doorId: string, { rejectWithValue }) => {
    try {
      const response = await doorService.saveDoor(doorId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save door');
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
      return rejectWithValue(error.response?.data?.message || 'Failed to remove saved door');
    }
  }
);

export const scanQRCode = createAsyncThunk(
  'doors/scanQRCode',
  async (qrCode: string, { rejectWithValue }) => {
    try {
      const response = await doorService.scanQRCode(qrCode);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Invalid QR code');
    }
  }
);

export const getDoorDetails = createAsyncThunk(
  'doors/getDoorDetails',
  async (doorId: string, { rejectWithValue }) => {
    try {
      const response = await doorService.getDoorDetails(doorId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get door details');
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
        state.doors = action.payload;
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
        const savedDoor = action.payload;
        const existingIndex = state.savedDoors.findIndex(door => door.id === savedDoor.id);
        if (existingIndex === -1) {
          state.savedDoors.push(savedDoor);
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
        state.selectedDoor = action.payload;
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
        state.selectedDoor = action.payload;
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
