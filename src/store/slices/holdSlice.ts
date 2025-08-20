import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { HoldState, Hold, HoldStatus } from '../../types';
import { holdService } from '../../services/holdService';

// ============================================================================
// ASYNC THUNKS
// ============================================================================

export const fetchHolds = createAsyncThunk(
  'holds/fetchHolds',
  async (_, { rejectWithValue }) => {
    try {
      const holds = await holdService.getHolds();
      return holds;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch holds');
    }
  }
);

export const fetchActiveHolds = createAsyncThunk(
  'holds/fetchActiveHolds',
  async (_, { rejectWithValue }) => {
    try {
      const holds = await holdService.getActiveHolds();
      return holds;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch active holds');
    }
  }
);

export const createHold = createAsyncThunk(
  'holds/createHold',
  async (holdData: Partial<Hold>, { rejectWithValue }) => {
    try {
      const hold = await holdService.createHold(holdData);
      return hold;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create hold');
    }
  }
);

export const updateHold = createAsyncThunk(
  'holds/updateHold',
  async ({ holdId, updates }: { holdId: string; updates: Partial<Hold> }, { rejectWithValue }) => {
    try {
      const hold = await holdService.updateHold(holdId, updates);
      return hold;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update hold');
    }
  }
);

export const cancelHold = createAsyncThunk(
  'holds/cancelHold',
  async (holdId: string, { rejectWithValue }) => {
    try {
      const hold = await holdService.cancelHold(holdId);
      return hold;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel hold');
    }
  }
);

export const extendHold = createAsyncThunk(
  'holds/extendHold',
  async ({ holdId, newEndTime }: { holdId: string; newEndTime: Date }, { rejectWithValue }) => {
    try {
      const hold = await holdService.extendHold(holdId, newEndTime);
      return hold;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to extend hold');
    }
  }
);

export const notifyAffectedUsers = createAsyncThunk(
  'holds/notifyAffectedUsers',
  async (holdId: string, { rejectWithValue }) => {
    try {
      await holdService.notifyAffectedUsers(holdId);
      return holdId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to notify affected users');
    }
  }
);

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: HoldState = {
  holds: [],
  activeHolds: [],
  isLoading: false,
  error: null,
};

// ============================================================================
// HOLD SLICE
// ============================================================================

const holdSlice = createSlice({
  name: 'holds',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addHold: (state, action: PayloadAction<Hold>) => {
      const newHold = action.payload;
      state.holds.unshift(newHold);
      
      if (newHold.status === HoldStatus.ACTIVE) {
        state.activeHolds.unshift(newHold);
      }
    },
    updateHoldInState: (state, action: PayloadAction<Hold>) => {
      const updatedHold = action.payload;
      
      // Update in holds array
      const holdIndex = state.holds.findIndex(hold => hold.id === updatedHold.id);
      if (holdIndex !== -1) {
        state.holds[holdIndex] = updatedHold;
      }
      
      // Update in activeHolds array
      const activeHoldIndex = state.activeHolds.findIndex(hold => hold.id === updatedHold.id);
      if (activeHoldIndex !== -1) {
        if (updatedHold.status === HoldStatus.ACTIVE) {
          state.activeHolds[activeHoldIndex] = updatedHold;
        } else {
          state.activeHolds.splice(activeHoldIndex, 1);
        }
      } else if (updatedHold.status === HoldStatus.ACTIVE) {
        state.activeHolds.unshift(updatedHold);
      }
    },
    removeHold: (state, action: PayloadAction<string>) => {
      const holdId = action.payload;
      
      state.holds = state.holds.filter(hold => hold.id !== holdId);
      state.activeHolds = state.activeHolds.filter(hold => hold.id !== holdId);
    },
    clearExpiredHolds: (state) => {
      const now = new Date();
      
      // Remove expired holds from activeHolds
      state.activeHolds = state.activeHolds.filter(hold => {
        return hold.endTime > now && hold.status === HoldStatus.ACTIVE;
      });
      
      // Update status of expired holds in holds array
      state.holds = state.holds.map(hold => {
        if (hold.endTime <= now && hold.status === HoldStatus.ACTIVE) {
          return { ...hold, status: HoldStatus.EXPIRED };
        }
        return hold;
      });
    },
  },
  extraReducers: (builder) => {
    // Fetch holds
    builder
      .addCase(fetchHolds.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHolds.fulfilled, (state, action) => {
        state.isLoading = false;
        state.holds = action.payload;
      })
      .addCase(fetchHolds.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch active holds
    builder
      .addCase(fetchActiveHolds.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActiveHolds.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeHolds = action.payload;
      })
      .addCase(fetchActiveHolds.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create hold
    builder
      .addCase(createHold.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createHold.fulfilled, (state, action) => {
        state.isLoading = false;
        const newHold = action.payload;
        state.holds.unshift(newHold);
        
        if (newHold.status === HoldStatus.ACTIVE) {
          state.activeHolds.unshift(newHold);
        }
      })
      .addCase(createHold.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update hold
    builder
      .addCase(updateHold.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateHold.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedHold = action.payload;
        
        // Update in holds array
        const holdIndex = state.holds.findIndex(hold => hold.id === updatedHold.id);
        if (holdIndex !== -1) {
          state.holds[holdIndex] = updatedHold;
        }
        
        // Update in activeHolds array
        const activeHoldIndex = state.activeHolds.findIndex(hold => hold.id === updatedHold.id);
        if (activeHoldIndex !== -1) {
          if (updatedHold.status === HoldStatus.ACTIVE) {
            state.activeHolds[activeHoldIndex] = updatedHold;
          } else {
            state.activeHolds.splice(activeHoldIndex, 1);
          }
        } else if (updatedHold.status === HoldStatus.ACTIVE) {
          state.activeHolds.unshift(updatedHold);
        }
      })
      .addCase(updateHold.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Cancel hold
    builder
      .addCase(cancelHold.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelHold.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedHold = action.payload;
        
        // Update in holds array
        const holdIndex = state.holds.findIndex(hold => hold.id === updatedHold.id);
        if (holdIndex !== -1) {
          state.holds[holdIndex] = updatedHold;
        }
        
        // Remove from activeHolds array
        const activeHoldIndex = state.activeHolds.findIndex(hold => hold.id === updatedHold.id);
        if (activeHoldIndex !== -1) {
          state.activeHolds.splice(activeHoldIndex, 1);
        }
      })
      .addCase(cancelHold.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Extend hold
    builder
      .addCase(extendHold.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(extendHold.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedHold = action.payload;
        
        // Update in holds array
        const holdIndex = state.holds.findIndex(hold => hold.id === updatedHold.id);
        if (holdIndex !== -1) {
          state.holds[holdIndex] = updatedHold;
        }
        
        // Update in activeHolds array
        const activeHoldIndex = state.activeHolds.findIndex(hold => hold.id === updatedHold.id);
        if (activeHoldIndex !== -1) {
          state.activeHolds[activeHoldIndex] = updatedHold;
        }
      })
      .addCase(extendHold.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Notify affected users
    builder
      .addCase(notifyAffectedUsers.fulfilled, (state, action) => {
        const holdId = action.payload;
        
        // Mark hold as notified
        const holdIndex = state.holds.findIndex(hold => hold.id === holdId);
        if (holdIndex !== -1) {
          state.holds[holdIndex].notificationsSent = true;
        }
        
        const activeHoldIndex = state.activeHolds.findIndex(hold => hold.id === holdId);
        if (activeHoldIndex !== -1) {
          state.activeHolds[activeHoldIndex].notificationsSent = true;
        }
      });
  },
});

export const {
  clearError,
  addHold,
  updateHoldInState,
  removeHold,
  clearExpiredHolds,
} = holdSlice.actions;

export default holdSlice.reducer;
