import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RequestState, AccessRequest, RequestForm, RequestFilters } from '../../types';
import { requestService } from '../../services/requestService';

// Async thunks
export const fetchRequests = createAsyncThunk(
  'requests/fetchRequests',
  async (filters?: RequestFilters, { rejectWithValue }) => {
    try {
      const response = await requestService.getRequests(filters);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch requests');
    }
  }
);

export const fetchUserRequests = createAsyncThunk(
  'requests/fetchUserRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await requestService.getUserRequests();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user requests');
    }
  }
);

export const createRequest = createAsyncThunk(
  'requests/createRequest',
  async (requestData: RequestForm, { rejectWithValue }) => {
    try {
      const response = await requestService.createRequest(requestData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create request');
    }
  }
);

export const updateRequestStatus = createAsyncThunk(
  'requests/updateStatus',
  async ({ requestId, status }: { requestId: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await requestService.updateRequestStatus(requestId, status);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update request status');
    }
  }
);

export const getRequestDetails = createAsyncThunk(
  'requests/getRequestDetails',
  async (requestId: string, { rejectWithValue }) => {
    try {
      const response = await requestService.getRequestDetails(requestId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get request details');
    }
  }
);

// Initial state
const initialState: RequestState = {
  requests: [],
  userRequests: [],
  isLoading: false,
  error: null,
  selectedRequest: null,
  filters: {},
};

// Request slice
const requestSlice = createSlice({
  name: 'requests',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedRequest: (state, action: PayloadAction<AccessRequest | null>) => {
      state.selectedRequest = action.payload;
    },
    clearSelectedRequest: (state) => {
      state.selectedRequest = null;
    },
    setFilters: (state, action: PayloadAction<RequestFilters>) => {
      state.filters = action.payload;
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    addRequest: (state, action: PayloadAction<AccessRequest>) => {
      state.requests.unshift(action.payload);
      state.userRequests.unshift(action.payload);
    },
    updateRequest: (state, action: PayloadAction<AccessRequest>) => {
      const updatedRequest = action.payload;
      
      // Update in requests array
      const requestIndex = state.requests.findIndex(req => req.id === updatedRequest.id);
      if (requestIndex !== -1) {
        state.requests[requestIndex] = updatedRequest;
      }
      
      // Update in userRequests array
      const userRequestIndex = state.userRequests.findIndex(req => req.id === updatedRequest.id);
      if (userRequestIndex !== -1) {
        state.userRequests[userRequestIndex] = updatedRequest;
      }
      
      // Update selected request if it's the same
      if (state.selectedRequest?.id === updatedRequest.id) {
        state.selectedRequest = updatedRequest;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch requests
    builder
      .addCase(fetchRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.requests = action.payload;
      })
      .addCase(fetchRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch user requests
    builder
      .addCase(fetchUserRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userRequests = action.payload;
      })
      .addCase(fetchUserRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create request
    builder
      .addCase(createRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        const newRequest = action.payload;
        state.requests.unshift(newRequest);
        state.userRequests.unshift(newRequest);
      })
      .addCase(createRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update request status
    builder
      .addCase(updateRequestStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateRequestStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedRequest = action.payload;
        
        // Update in requests array
        const requestIndex = state.requests.findIndex(req => req.id === updatedRequest.id);
        if (requestIndex !== -1) {
          state.requests[requestIndex] = updatedRequest;
        }
        
        // Update in userRequests array
        const userRequestIndex = state.userRequests.findIndex(req => req.id === updatedRequest.id);
        if (userRequestIndex !== -1) {
          state.userRequests[userRequestIndex] = updatedRequest;
        }
        
        // Update selected request if it's the same
        if (state.selectedRequest?.id === updatedRequest.id) {
          state.selectedRequest = updatedRequest;
        }
      })
      .addCase(updateRequestStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get request details
    builder
      .addCase(getRequestDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getRequestDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedRequest = action.payload;
      })
      .addCase(getRequestDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  setSelectedRequest, 
  clearSelectedRequest, 
  setFilters, 
  clearFilters,
  addRequest,
  updateRequest
} = requestSlice.actions;

export default requestSlice.reducer;
