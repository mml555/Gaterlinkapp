import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  EquipmentState, 
  Equipment, 
  Reservation, 
  EquipmentStatus, 
  ReservationStatus,
  ChecklistResponse,
  DamageReport
} from '../../types';
import { equipmentService } from '../../services/equipmentService';

// ============================================================================
// ASYNC THUNKS
// ============================================================================

export const fetchEquipment = createAsyncThunk(
  'equipment/fetchEquipment',
  async (_, { rejectWithValue }) => {
    try {
      const equipment = await equipmentService.getEquipment();
      return equipment;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch equipment');
    }
  }
);

export const fetchEquipmentBySite = createAsyncThunk(
  'equipment/fetchEquipmentBySite',
  async (siteId: string, { rejectWithValue }) => {
    try {
      const equipment = await equipmentService.getEquipmentBySite(siteId);
      return { siteId, equipment };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch equipment by site');
    }
  }
);

export const fetchEquipmentById = createAsyncThunk(
  'equipment/fetchEquipmentById',
  async (equipmentId: string, { rejectWithValue }) => {
    try {
      const equipment = await equipmentService.getEquipmentById(equipmentId);
      return equipment;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch equipment');
    }
  }
);

export const createEquipment = createAsyncThunk(
  'equipment/createEquipment',
  async (equipmentData: Partial<Equipment>, { rejectWithValue }) => {
    try {
      const equipment = await equipmentService.createEquipment(equipmentData);
      return equipment;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create equipment');
    }
  }
);

export const updateEquipment = createAsyncThunk(
  'equipment/updateEquipment',
  async ({ equipmentId, updates }: { equipmentId: string; updates: Partial<Equipment> }, { rejectWithValue }) => {
    try {
      const equipment = await equipmentService.updateEquipment(equipmentId, updates);
      return equipment;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update equipment');
    }
  }
);

export const deleteEquipment = createAsyncThunk(
  'equipment/deleteEquipment',
  async (equipmentId: string, { rejectWithValue }) => {
    try {
      await equipmentService.deleteEquipment(equipmentId);
      return equipmentId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete equipment');
    }
  }
);

export const setEquipmentStatus = createAsyncThunk(
  'equipment/setEquipmentStatus',
  async ({ equipmentId, status }: { equipmentId: string; status: EquipmentStatus }, { rejectWithValue }) => {
    try {
      const equipment = await equipmentService.setEquipmentStatus(equipmentId, status);
      return equipment;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to set equipment status');
    }
  }
);

// Reservation Management
export const fetchReservations = createAsyncThunk(
  'equipment/fetchReservations',
  async (_, { rejectWithValue }) => {
    try {
      const reservations = await equipmentService.getReservations();
      return reservations;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch reservations');
    }
  }
);

export const fetchUserReservations = createAsyncThunk(
  'equipment/fetchUserReservations',
  async (_, { rejectWithValue }) => {
    try {
      const reservations = await equipmentService.getUserReservations();
      return reservations;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user reservations');
    }
  }
);

export const createReservation = createAsyncThunk(
  'equipment/createReservation',
  async (reservationData: Partial<Reservation>, { rejectWithValue }) => {
    try {
      const reservation = await equipmentService.createReservation(reservationData);
      return reservation;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create reservation');
    }
  }
);

export const updateReservation = createAsyncThunk(
  'equipment/updateReservation',
  async ({ reservationId, updates }: { reservationId: string; updates: Partial<Reservation> }, { rejectWithValue }) => {
    try {
      const reservation = await equipmentService.updateReservation(reservationId, updates);
      return reservation;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update reservation');
    }
  }
);

export const cancelReservation = createAsyncThunk(
  'equipment/cancelReservation',
  async (reservationId: string, { rejectWithValue }) => {
    try {
      const reservation = await equipmentService.cancelReservation(reservationId);
      return reservation;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to cancel reservation');
    }
  }
);

export const approveReservation = createAsyncThunk(
  'equipment/approveReservation',
  async (reservationId: string, { rejectWithValue }) => {
    try {
      const reservation = await equipmentService.approveReservation(reservationId);
      return reservation;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to approve reservation');
    }
  }
);

export const denyReservation = createAsyncThunk(
  'equipment/denyReservation',
  async ({ reservationId, reason }: { reservationId: string; reason: string }, { rejectWithValue }) => {
    try {
      const reservation = await equipmentService.denyReservation(reservationId, reason);
      return reservation;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to deny reservation');
    }
  }
);

// Checklist Management
export const submitChecklist = createAsyncThunk(
  'equipment/submitChecklist',
  async ({ reservationId, checklistResponse }: { reservationId: string; checklistResponse: ChecklistResponse }, { rejectWithValue }) => {
    try {
      const response = await equipmentService.submitChecklist(reservationId, checklistResponse);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to submit checklist');
    }
  }
);

// Damage Report Management
export const submitDamageReport = createAsyncThunk(
  'equipment/submitDamageReport',
  async ({ reservationId, damageReport }: { reservationId: string; damageReport: Partial<DamageReport> }, { rejectWithValue }) => {
    try {
      const report = await equipmentService.submitDamageReport(reservationId, damageReport);
      return report;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to submit damage report');
    }
  }
);

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: EquipmentState = {
  equipment: [],
  reservations: [],
  userReservations: [],
  isLoading: false,
  error: null,
  selectedEquipment: null,
  selectedReservation: null,
};

// ============================================================================
// EQUIPMENT SLICE
// ============================================================================

const equipmentSlice = createSlice({
  name: 'equipment',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedEquipment: (state, action: PayloadAction<Equipment | null>) => {
      state.selectedEquipment = action.payload;
    },
    clearSelectedEquipment: (state) => {
      state.selectedEquipment = null;
    },
    setSelectedReservation: (state, action: PayloadAction<Reservation | null>) => {
      state.selectedReservation = action.payload;
    },
    clearSelectedReservation: (state) => {
      state.selectedReservation = null;
    },
    addEquipment: (state, action: PayloadAction<Equipment>) => {
      state.equipment.unshift(action.payload);
    },
    updateEquipmentInState: (state, action: PayloadAction<Equipment>) => {
      const updatedEquipment = action.payload;
      
      const equipmentIndex = state.equipment.findIndex(eq => eq.id === updatedEquipment.id);
      if (equipmentIndex !== -1) {
        state.equipment[equipmentIndex] = updatedEquipment;
      }
      
      if (state.selectedEquipment?.id === updatedEquipment.id) {
        state.selectedEquipment = updatedEquipment;
      }
    },
    removeEquipment: (state, action: PayloadAction<string>) => {
      const equipmentId = action.payload;
      
      state.equipment = state.equipment.filter(eq => eq.id !== equipmentId);
      
      if (state.selectedEquipment?.id === equipmentId) {
        state.selectedEquipment = null;
      }
    },
    addReservation: (state, action: PayloadAction<Reservation>) => {
      const newReservation = action.payload;
      state.reservations.unshift(newReservation);
      state.userReservations.unshift(newReservation);
    },
    updateReservationInState: (state, action: PayloadAction<Reservation>) => {
      const updatedReservation = action.payload;
      
      const reservationIndex = state.reservations.findIndex(res => res.id === updatedReservation.id);
      if (reservationIndex !== -1) {
        state.reservations[reservationIndex] = updatedReservation;
      }
      
      const userReservationIndex = state.userReservations.findIndex(res => res.id === updatedReservation.id);
      if (userReservationIndex !== -1) {
        state.userReservations[userReservationIndex] = updatedReservation;
      }
      
      if (state.selectedReservation?.id === updatedReservation.id) {
        state.selectedReservation = updatedReservation;
      }
    },
    removeReservation: (state, action: PayloadAction<string>) => {
      const reservationId = action.payload;
      
      state.reservations = state.reservations.filter(res => res.id !== reservationId);
      state.userReservations = state.userReservations.filter(res => res.id !== reservationId);
      
      if (state.selectedReservation?.id === reservationId) {
        state.selectedReservation = null;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch equipment
    builder
      .addCase(fetchEquipment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEquipment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.equipment = action.payload;
      })
      .addCase(fetchEquipment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch equipment by site
    builder
      .addCase(fetchEquipmentBySite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEquipmentBySite.fulfilled, (state, action) => {
        state.isLoading = false;
        const { siteId, equipment } = action.payload;
        // Filter equipment by site
        state.equipment = state.equipment.filter(eq => eq.siteId !== siteId).concat(equipment);
      })
      .addCase(fetchEquipmentBySite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch equipment by ID
    builder
      .addCase(fetchEquipmentById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEquipmentById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedEquipment = action.payload;
      })
      .addCase(fetchEquipmentById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create equipment
    builder
      .addCase(createEquipment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createEquipment.fulfilled, (state, action) => {
        state.isLoading = false;
        const newEquipment = action.payload;
        state.equipment.unshift(newEquipment);
      })
      .addCase(createEquipment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update equipment
    builder
      .addCase(updateEquipment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateEquipment.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedEquipment = action.payload;
        
        const equipmentIndex = state.equipment.findIndex(eq => eq.id === updatedEquipment.id);
        if (equipmentIndex !== -1) {
          state.equipment[equipmentIndex] = updatedEquipment;
        }
        
        if (state.selectedEquipment?.id === updatedEquipment.id) {
          state.selectedEquipment = updatedEquipment;
        }
      })
      .addCase(updateEquipment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete equipment
    builder
      .addCase(deleteEquipment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteEquipment.fulfilled, (state, action) => {
        state.isLoading = false;
        const equipmentId = action.payload;
        
        state.equipment = state.equipment.filter(eq => eq.id !== equipmentId);
        
        if (state.selectedEquipment?.id === equipmentId) {
          state.selectedEquipment = null;
        }
      })
      .addCase(deleteEquipment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Set equipment status
    builder
      .addCase(setEquipmentStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setEquipmentStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedEquipment = action.payload;
        
        const equipmentIndex = state.equipment.findIndex(eq => eq.id === updatedEquipment.id);
        if (equipmentIndex !== -1) {
          state.equipment[equipmentIndex] = updatedEquipment;
        }
        
        if (state.selectedEquipment?.id === updatedEquipment.id) {
          state.selectedEquipment = updatedEquipment;
        }
      })
      .addCase(setEquipmentStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch reservations
    builder
      .addCase(fetchReservations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReservations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reservations = action.payload;
      })
      .addCase(fetchReservations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch user reservations
    builder
      .addCase(fetchUserReservations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserReservations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userReservations = action.payload;
      })
      .addCase(fetchUserReservations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create reservation
    builder
      .addCase(createReservation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createReservation.fulfilled, (state, action) => {
        state.isLoading = false;
        const newReservation = action.payload;
        state.reservations.unshift(newReservation);
        state.userReservations.unshift(newReservation);
      })
      .addCase(createReservation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update reservation
    builder
      .addCase(updateReservation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateReservation.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedReservation = action.payload;
        
        const reservationIndex = state.reservations.findIndex(res => res.id === updatedReservation.id);
        if (reservationIndex !== -1) {
          state.reservations[reservationIndex] = updatedReservation;
        }
        
        const userReservationIndex = state.userReservations.findIndex(res => res.id === updatedReservation.id);
        if (userReservationIndex !== -1) {
          state.userReservations[userReservationIndex] = updatedReservation;
        }
        
        if (state.selectedReservation?.id === updatedReservation.id) {
          state.selectedReservation = updatedReservation;
        }
      })
      .addCase(updateReservation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Cancel reservation
    builder
      .addCase(cancelReservation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelReservation.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedReservation = action.payload;
        
        const reservationIndex = state.reservations.findIndex(res => res.id === updatedReservation.id);
        if (reservationIndex !== -1) {
          state.reservations[reservationIndex] = updatedReservation;
        }
        
        const userReservationIndex = state.userReservations.findIndex(res => res.id === updatedReservation.id);
        if (userReservationIndex !== -1) {
          state.userReservations[userReservationIndex] = updatedReservation;
        }
        
        if (state.selectedReservation?.id === updatedReservation.id) {
          state.selectedReservation = updatedReservation;
        }
      })
      .addCase(cancelReservation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Approve reservation
    builder
      .addCase(approveReservation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(approveReservation.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedReservation = action.payload;
        
        const reservationIndex = state.reservations.findIndex(res => res.id === updatedReservation.id);
        if (reservationIndex !== -1) {
          state.reservations[reservationIndex] = updatedReservation;
        }
        
        const userReservationIndex = state.userReservations.findIndex(res => res.id === updatedReservation.id);
        if (userReservationIndex !== -1) {
          state.userReservations[userReservationIndex] = updatedReservation;
        }
        
        if (state.selectedReservation?.id === updatedReservation.id) {
          state.selectedReservation = updatedReservation;
        }
      })
      .addCase(approveReservation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Deny reservation
    builder
      .addCase(denyReservation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(denyReservation.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedReservation = action.payload;
        
        const reservationIndex = state.reservations.findIndex(res => res.id === updatedReservation.id);
        if (reservationIndex !== -1) {
          state.reservations[reservationIndex] = updatedReservation;
        }
        
        const userReservationIndex = state.userReservations.findIndex(res => res.id === updatedReservation.id);
        if (userReservationIndex !== -1) {
          state.userReservations[userReservationIndex] = updatedReservation;
        }
        
        if (state.selectedReservation?.id === updatedReservation.id) {
          state.selectedReservation = updatedReservation;
        }
      })
      .addCase(denyReservation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Submit checklist
    builder
      .addCase(submitChecklist.fulfilled, (state, action) => {
        // Update the reservation with the checklist response
        const { reservationId, checklistResponse } = action.payload;
        
        const reservationIndex = state.reservations.findIndex(res => res.id === reservationId);
        if (reservationIndex !== -1) {
          if (checklistResponse.type === 'pre_use') {
            state.reservations[reservationIndex].preUseChecklist = checklistResponse;
          } else if (checklistResponse.type === 'post_use') {
            state.reservations[reservationIndex].postUseChecklist = checklistResponse;
          }
        }
        
        const userReservationIndex = state.userReservations.findIndex(res => res.id === reservationId);
        if (userReservationIndex !== -1) {
          if (checklistResponse.type === 'pre_use') {
            state.userReservations[userReservationIndex].preUseChecklist = checklistResponse;
          } else if (checklistResponse.type === 'post_use') {
            state.userReservations[userReservationIndex].postUseChecklist = checklistResponse;
          }
        }
        
        if (state.selectedReservation?.id === reservationId) {
          if (checklistResponse.type === 'pre_use') {
            state.selectedReservation.preUseChecklist = checklistResponse;
          } else if (checklistResponse.type === 'post_use') {
            state.selectedReservation.postUseChecklist = checklistResponse;
          }
        }
      });

    // Submit damage report
    builder
      .addCase(submitDamageReport.fulfilled, (state, action) => {
        const { reservationId, damageReport } = action.payload;
        
        const reservationIndex = state.reservations.findIndex(res => res.id === reservationId);
        if (reservationIndex !== -1) {
          state.reservations[reservationIndex].damageReport = damageReport;
        }
        
        const userReservationIndex = state.userReservations.findIndex(res => res.id === reservationId);
        if (userReservationIndex !== -1) {
          state.userReservations[userReservationIndex].damageReport = damageReport;
        }
        
        if (state.selectedReservation?.id === reservationId) {
          state.selectedReservation.damageReport = damageReport;
        }
      });
  },
});

export const {
  clearError,
  setSelectedEquipment,
  clearSelectedEquipment,
  setSelectedReservation,
  clearSelectedReservation,
  addEquipment,
  updateEquipmentInState,
  removeEquipment,
  addReservation,
  updateReservationInState,
  removeReservation,
} = equipmentSlice.actions;

export default equipmentSlice.reducer;
