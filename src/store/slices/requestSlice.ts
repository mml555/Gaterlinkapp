import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { RequestState, AccessRequest, RequestForm, RequestFilters } from '../../types';
import { requestService } from '../../services/requestService';

// Async thunks
export const fetchRequests = createAsyncThunk(
  'requests/fetchRequests',
  async ({ filters }: { filters?: RequestFilters } = {}, { rejectWithValue }) => {
    try {
      const requests = await requestService.getRequests(filters as any);
      return requests;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch requests');
    }
  }
);

export const fetchUserRequests = createAsyncThunk(
  'requests/fetchUserRequests',
  async (_, { rejectWithValue }) => {
    try {
      // For now, return empty array since getUserRequests doesn't exist
      return [];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user requests');
    }
  }
);

export const createRequest = createAsyncThunk(
  'requests/createRequest',
  async (requestData: RequestForm, { rejectWithValue }) => {
    try {
      const request = await requestService.createRequest(requestData);
      return request;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create request');
    }
  }
);

export const updateRequestStatus = createAsyncThunk(
  'requests/updateStatus',
  async ({ requestId, status }: { requestId: string; status: string }, { rejectWithValue }) => {
    try {
      const request = await requestService.updateRequest(requestId, { status: status as any });
      return request;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update request status');
    }
  }
);

export const getRequestDetails = createAsyncThunk(
  'requests/getRequestDetails',
  async (requestId: string, { rejectWithValue }) => {
    try {
      const request = await requestService.getRequestById(requestId);
      return request;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get request details');
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
        // Transform AccessRequest[] to include missing fields
        state.requests = action.payload.map(request => ({
          ...request,
          status: request.status as any,
          userId: request.requesterId,
          priority: 'medium' as any,
          category: 'access' as any,
          title: `Access request for ${request.doorName}`,
          description: request.reason || 'No description provided',
        }));
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
        // Transform newRequest to include missing fields
        const transformedRequest = {
          ...newRequest,
          status: newRequest.status as any,
          userId: newRequest.requesterId,
          priority: 'medium' as any,
          category: 'access' as any,
          title: `Access request for ${newRequest.doorName}`,
          description: newRequest.reason || 'No description provided',
        };
        state.requests.unshift(transformedRequest);
        state.userRequests.unshift(transformedRequest);
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
        if (updatedRequest) {
          // Transform updatedRequest to include missing fields
          const transformedRequest = {
            ...updatedRequest,
            status: updatedRequest.status as any,
            userId: updatedRequest.requesterId,
            priority: 'medium' as any,
            category: 'access' as any,
            title: `Access request for ${updatedRequest.doorName}`,
            description: updatedRequest.reason || 'No description provided',
          };
          
          const requestIndex = state.requests.findIndex(req => req.id === updatedRequest.id);
          if (requestIndex !== -1) {
            state.requests[requestIndex] = transformedRequest;
          }
          
          // Update in userRequests array
          const userRequestIndex = state.userRequests.findIndex(req => req.id === updatedRequest.id);
          if (userRequestIndex !== -1) {
            state.userRequests[userRequestIndex] = transformedRequest;
          }
          
          // Update selected request if it's the same
          if (state.selectedRequest?.id === updatedRequest.id) {
            state.selectedRequest = transformedRequest;
          }
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
        // Transform AccessRequest to include missing fields
        if (action.payload) {
          state.selectedRequest = {
            ...action.payload,
            status: action.payload.status as any,
            userId: action.payload.requesterId,
            priority: 'medium' as any,
            category: 'access' as any,
            title: `Access request for ${action.payload.doorName}`,
            description: action.payload.reason || 'No description provided',
          };
        } else {
          state.selectedRequest = null;
        }
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
