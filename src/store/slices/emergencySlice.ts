import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  EmergencyState, 
  EmergencyEvent, 
  EmergencyStatus, 
  EmergencyType,
  EmergencySeverity,
  ReadAcknowledgment
} from '../../types';
import { emergencyService } from '../../services/emergencyService';
import { RootState } from '../index';

// ============================================================================
// ASYNC THUNKS
// ============================================================================

export const fetchEmergencies = createAsyncThunk(
  'emergencies/fetchEmergencies',
  async (_, { rejectWithValue }) => {
    try {
      const emergencies = await emergencyService.getEmergencies();
      return emergencies;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch emergencies');
    }
  }
);

export const fetchActiveEmergencies = createAsyncThunk(
  'emergencies/fetchActiveEmergencies',
  async (_, { rejectWithValue }) => {
    try {
      const emergencies = await emergencyService.getActiveEmergencies();
      return emergencies;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch active emergencies');
    }
  }
);

export const createEmergency = createAsyncThunk(
  'emergencies/createEmergency',
  async (emergencyData: Partial<EmergencyEvent>, { rejectWithValue }) => {
    try {
      const emergency = await emergencyService.createEmergency(emergencyData);
      return emergency;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create emergency');
    }
  }
);

export const updateEmergency = createAsyncThunk(
  'emergencies/updateEmergency',
  async ({ emergencyId, updates }: { emergencyId: string; updates: Partial<EmergencyEvent> }, { rejectWithValue }) => {
    try {
      const emergency = await emergencyService.updateEmergency(emergencyId, updates);
      return emergency;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update emergency');
    }
  }
);

export const resolveEmergency = createAsyncThunk(
  'emergencies/resolveEmergency',
  async (emergencyId: string, { rejectWithValue }) => {
    try {
      const emergency = await emergencyService.resolveEmergency(emergencyId);
      return emergency;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to resolve emergency');
    }
  }
);

export const cancelEmergency = createAsyncThunk(
  'emergencies/cancelEmergency',
  async (emergencyId: string, { rejectWithValue }) => {
    try {
      const emergency = await emergencyService.cancelEmergency(emergencyId);
      return emergency;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel emergency');
    }
  }
);

export const broadcastEmergency = createAsyncThunk(
  'emergencies/broadcastEmergency',
  async (emergencyId: string, { rejectWithValue }) => {
    try {
      await emergencyService.broadcastEmergency(emergencyId);
      return emergencyId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to broadcast emergency');
    }
  }
);

export const acknowledgeEmergency = createAsyncThunk(
  'emergencies/acknowledgeEmergency',
  async ({ emergencyId, acknowledgment }: { emergencyId: string; acknowledgment: ReadAcknowledgment }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as RootState;
      const userId = state.auth.user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      await emergencyService.acknowledgeEmergency(emergencyId, userId, acknowledgment);
      return { emergencyId, acknowledgment };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to acknowledge emergency');
    }
  }
);

export const triggerEvacuation = createAsyncThunk(
  'emergencies/triggerEvacuation',
  async ({ siteId, reason }: { siteId: string; reason: string }, { rejectWithValue }) => {
    try {
      const emergency = await emergencyService.triggerEvacuation(siteId, reason);
      return emergency;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to trigger evacuation');
    }
  }
);

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: EmergencyState = {
  emergencies: [],
  activeEmergencies: [],
  isLoading: false,
  error: null,
};

// ============================================================================
// EMERGENCY SLICE
// ============================================================================

const emergencySlice = createSlice({
  name: 'emergencies',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addEmergency: (state, action: PayloadAction<EmergencyEvent>) => {
      const newEmergency = action.payload;
      state.emergencies.unshift(newEmergency);
      
      if (newEmergency.status === EmergencyStatus.ACTIVE) {
        state.activeEmergencies.unshift(newEmergency);
      }
    },
    updateEmergencyInState: (state, action: PayloadAction<EmergencyEvent>) => {
      const updatedEmergency = action.payload;
      
      // Update in emergencies array
      const emergencyIndex = state.emergencies.findIndex(emergency => emergency.id === updatedEmergency.id);
      if (emergencyIndex !== -1) {
        state.emergencies[emergencyIndex] = updatedEmergency;
      }
      
      // Update in activeEmergencies array
      const activeEmergencyIndex = state.activeEmergencies.findIndex(emergency => emergency.id === updatedEmergency.id);
      if (activeEmergencyIndex !== -1) {
        if (updatedEmergency.status === EmergencyStatus.ACTIVE) {
          state.activeEmergencies[activeEmergencyIndex] = updatedEmergency;
        } else {
          state.activeEmergencies.splice(activeEmergencyIndex, 1);
        }
      } else if (updatedEmergency.status === EmergencyStatus.ACTIVE) {
        state.activeEmergencies.unshift(updatedEmergency);
      }
    },
    removeEmergency: (state, action: PayloadAction<string>) => {
      const emergencyId = action.payload;
      
      state.emergencies = state.emergencies.filter(emergency => emergency.id !== emergencyId);
      state.activeEmergencies = state.activeEmergencies.filter(emergency => emergency.id !== emergencyId);
    },
    addAcknowledgment: (state, action: PayloadAction<{ emergencyId: string; acknowledgment: ReadAcknowledgment }>) => {
      const { emergencyId, acknowledgment } = action.payload;
      
      // Add acknowledgment to emergency in emergencies array
      const emergencyIndex = state.emergencies.findIndex(emergency => emergency.id === emergencyId);
      if (emergencyIndex !== -1) {
        state.emergencies[emergencyIndex].readAcknowledgments.push(acknowledgment);
      }
      
      // Add acknowledgment to emergency in activeEmergencies array
      const activeEmergencyIndex = state.activeEmergencies.findIndex(emergency => emergency.id === emergencyId);
      if (activeEmergencyIndex !== -1) {
        state.activeEmergencies[activeEmergencyIndex].readAcknowledgments.push(acknowledgment);
      }
    },
    clearResolvedEmergencies: (state) => {
      // Remove resolved emergencies from activeEmergencies
      state.activeEmergencies = state.activeEmergencies.filter(emergency => 
        emergency.status === EmergencyStatus.ACTIVE
      );
    },
  },
  extraReducers: (builder) => {
    // Fetch emergencies
    builder
      .addCase(fetchEmergencies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmergencies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.emergencies = action.payload;
      })
      .addCase(fetchEmergencies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch active emergencies
    builder
      .addCase(fetchActiveEmergencies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActiveEmergencies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activeEmergencies = action.payload;
      })
      .addCase(fetchActiveEmergencies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create emergency
    builder
      .addCase(createEmergency.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createEmergency.fulfilled, (state, action) => {
        state.isLoading = false;
        const newEmergency = action.payload;
        state.emergencies.unshift(newEmergency);
        
        if (newEmergency.status === EmergencyStatus.ACTIVE) {
          state.activeEmergencies.unshift(newEmergency);
        }
      })
      .addCase(createEmergency.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update emergency
    builder
      .addCase(updateEmergency.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateEmergency.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedEmergency = action.payload;
        
        // Update in emergencies array
        const emergencyIndex = state.emergencies.findIndex(emergency => emergency.id === updatedEmergency.id);
        if (emergencyIndex !== -1) {
          state.emergencies[emergencyIndex] = updatedEmergency;
        }
        
        // Update in activeEmergencies array
        const activeEmergencyIndex = state.activeEmergencies.findIndex(emergency => emergency.id === updatedEmergency.id);
        if (activeEmergencyIndex !== -1) {
          if (updatedEmergency.status === EmergencyStatus.ACTIVE) {
            state.activeEmergencies[activeEmergencyIndex] = updatedEmergency;
          } else {
            state.activeEmergencies.splice(activeEmergencyIndex, 1);
          }
        } else if (updatedEmergency.status === EmergencyStatus.ACTIVE) {
          state.activeEmergencies.unshift(updatedEmergency);
        }
      })
      .addCase(updateEmergency.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Resolve emergency
    builder
      .addCase(resolveEmergency.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resolveEmergency.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedEmergency = action.payload;
        
        // Update in emergencies array
        const emergencyIndex = state.emergencies.findIndex(emergency => emergency.id === updatedEmergency.id);
        if (emergencyIndex !== -1) {
          state.emergencies[emergencyIndex] = updatedEmergency;
        }
        
        // Remove from activeEmergencies array
        const activeEmergencyIndex = state.activeEmergencies.findIndex(emergency => emergency.id === updatedEmergency.id);
        if (activeEmergencyIndex !== -1) {
          state.activeEmergencies.splice(activeEmergencyIndex, 1);
        }
      })
      .addCase(resolveEmergency.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Cancel emergency
    builder
      .addCase(cancelEmergency.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelEmergency.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedEmergency = action.payload;
        
        // Update in emergencies array
        const emergencyIndex = state.emergencies.findIndex(emergency => emergency.id === updatedEmergency.id);
        if (emergencyIndex !== -1) {
          state.emergencies[emergencyIndex] = updatedEmergency;
        }
        
        // Remove from activeEmergencies array
        const activeEmergencyIndex = state.activeEmergencies.findIndex(emergency => emergency.id === updatedEmergency.id);
        if (activeEmergencyIndex !== -1) {
          state.activeEmergencies.splice(activeEmergencyIndex, 1);
        }
      })
      .addCase(cancelEmergency.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Broadcast emergency
    builder
      .addCase(broadcastEmergency.fulfilled, (state, action) => {
        const emergencyId = action.payload;
        
        // Mark emergency as broadcasted
        const emergencyIndex = state.emergencies.findIndex(emergency => emergency.id === emergencyId);
        if (emergencyIndex !== -1) {
          state.emergencies[emergencyIndex].notificationsSent = true;
        }
        
        const activeEmergencyIndex = state.activeEmergencies.findIndex(emergency => emergency.id === emergencyId);
        if (activeEmergencyIndex !== -1) {
          state.activeEmergencies[activeEmergencyIndex].notificationsSent = true;
        }
      });

    // Acknowledge emergency
    builder
      .addCase(acknowledgeEmergency.fulfilled, (state, action) => {
        const { emergencyId, acknowledgment } = action.payload;
        
        // Add acknowledgment to emergency in emergencies array
        const emergencyIndex = state.emergencies.findIndex(emergency => emergency.id === emergencyId);
        if (emergencyIndex !== -1) {
          state.emergencies[emergencyIndex].readAcknowledgments.push(acknowledgment);
        }
        
        // Add acknowledgment to emergency in activeEmergencies array
        const activeEmergencyIndex = state.activeEmergencies.findIndex(emergency => emergency.id === emergencyId);
        if (activeEmergencyIndex !== -1) {
          state.activeEmergencies[activeEmergencyIndex].readAcknowledgments.push(acknowledgment);
        }
      });

    // Trigger evacuation
    builder
      .addCase(triggerEvacuation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(triggerEvacuation.fulfilled, (state, action) => {
        state.isLoading = false;
        const newEmergency = action.payload;
        state.emergencies.unshift(newEmergency);
        
        if (newEmergency.status === EmergencyStatus.ACTIVE) {
          state.activeEmergencies.unshift(newEmergency);
        }
      })
      .addCase(triggerEvacuation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  addEmergency,
  updateEmergencyInState,
  removeEmergency,
  addAcknowledgment,
  clearResolvedEmergencies,
} = emergencySlice.actions;

export default emergencySlice.reducer;
