import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  RequestState, 
  AccessRequest, 
  RequestForm, 
  RequestFilters,
  RequestStatus,
  Document,
  DocumentStatus,
  UserRole
} from '../../types';
import { requestService } from '../../services/requestService';

// ============================================================================
// ASYNC THUNKS
// ============================================================================

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
      const requests = await requestService.getUserRequests();
      return requests;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user requests');
    }
  }
);

export const fetchPendingRequests = createAsyncThunk(
  'requests/fetchPendingRequests',
  async (_, { rejectWithValue }) => {
    try {
      const requests = await requestService.getPendingRequests();
      return requests;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch pending requests');
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

export const approveRequest = createAsyncThunk(
  'requests/approveRequest',
  async ({ 
    requestId, 
    adminNotes, 
    accessToken, 
    accessCode, 
    expiresAt 
  }: {
    requestId: string;
    adminNotes?: string;
    accessToken?: string;
    accessCode?: string;
    expiresAt?: Date;
  }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const adminUser = state.auth.user;
      
      const request = await requestService.approveRequest(requestId, {
        approvedBy: adminUser.id,
        approvedAt: new Date(),
        adminNotes,
        accessToken,
        accessCode,
        expiresAt,
      });

      // Send notification to the requester
      await requestService.sendNotification(request.userId, 'ACCESS_GRANTED', {
        requestId,
        doorName: request.doorName,
        accessCode,
        expiresAt,
      });

      return request;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to approve request');
    }
  }
);

export const denyRequest = createAsyncThunk(
  'requests/denyRequest',
  async ({ 
    requestId, 
    reason 
  }: {
    requestId: string;
    reason: string;
  }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const adminUser = state.auth.user;
      
      const request = await requestService.denyRequest(requestId, {
        deniedBy: adminUser.id,
        deniedAt: new Date(),
        denialReason: reason,
      });

      // Send notification to the requester
      await requestService.sendNotification(request.userId, 'ACCESS_DENIED', {
        requestId,
        doorName: request.doorName,
        reason,
      });

      return request;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to deny request');
    }
  }
);

export const sendMessageToRequest = createAsyncThunk(
  'requests/sendMessage',
  async ({ 
    requestId, 
    message 
  }: {
    requestId: string;
    message: string;
  }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as any;
      const user = state.auth.user;
      
      const chatMessage = await requestService.sendMessage(requestId, {
        senderId: user.id,
        message,
        timestamp: new Date(),
      });

      // Send notification to the other party
      const request = state.requests.requests.find((r: AccessRequest) => r.id === requestId);
      const recipientId = user.role === UserRole.ADMIN ? request.userId : request.approvedBy;
      
      await requestService.sendNotification(recipientId, 'NEW_MESSAGE', {
        requestId,
        message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      });

      return { requestId, message: chatMessage };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

export const uploadDocument = createAsyncThunk(
  'requests/uploadDocument',
  async ({ 
    requestId, 
    document 
  }: {
    requestId: string;
    document: {
      name: string;
      type: string;
      file: File;
    };
  }, { rejectWithValue }) => {
    try {
      const uploadedDocument = await requestService.uploadDocument(requestId, document);
      return { requestId, document: uploadedDocument };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to upload document');
    }
  }
);

export const validateDocuments = createAsyncThunk(
  'requests/validateDocuments',
  async ({ 
    userId, 
    requiredDocuments 
  }: {
    userId: string;
    requiredDocuments: string[];
  }, { rejectWithValue }) => {
    try {
      const validation = await requestService.validateDocuments(userId, requiredDocuments);
      return validation;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to validate documents');
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

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: RequestState = {
  requests: [],
  userRequests: [],
  pendingRequests: [],
  isLoading: false,
  error: null,
  selectedRequest: null,
  filters: {},
};

// ============================================================================
// REQUEST SLICE
// ============================================================================

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
      
      // Add to pending requests if status is pending
      if (action.payload.status === RequestStatus.PENDING) {
        state.pendingRequests.unshift(action.payload);
      }
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
      
      // Update in pendingRequests array
      const pendingIndex = state.pendingRequests.findIndex(req => req.id === updatedRequest.id);
      if (pendingIndex !== -1) {
        if (updatedRequest.status === RequestStatus.PENDING) {
          state.pendingRequests[pendingIndex] = updatedRequest;
        } else {
          state.pendingRequests.splice(pendingIndex, 1);
        }
      } else if (updatedRequest.status === RequestStatus.PENDING) {
        state.pendingRequests.unshift(updatedRequest);
      }
      
      // Update selected request if it's the same
      if (state.selectedRequest?.id === updatedRequest.id) {
        state.selectedRequest = updatedRequest;
      }
    },
    removeRequest: (state, action: PayloadAction<string>) => {
      const requestId = action.payload;
      
      state.requests = state.requests.filter(req => req.id !== requestId);
      state.userRequests = state.userRequests.filter(req => req.id !== requestId);
      state.pendingRequests = state.pendingRequests.filter(req => req.id !== requestId);
      
      if (state.selectedRequest?.id === requestId) {
        state.selectedRequest = null;
      }
    },
    addDocumentToRequest: (state, action: PayloadAction<{ requestId: string; document: Document }>) => {
      const { requestId, document } = action.payload;
      
      // Update the request with the new document
      const request = state.requests.find(req => req.id === requestId);
      if (request) {
        if (!request.documents) {
          request.documents = [];
        }
        request.documents.push(document);
      }
      
      // Update in other arrays
      const userRequest = state.userRequests.find(req => req.id === requestId);
      if (userRequest) {
        if (!userRequest.documents) {
          userRequest.documents = [];
        }
        userRequest.documents.push(document);
      }
      
      const pendingRequest = state.pendingRequests.find(req => req.id === requestId);
      if (pendingRequest) {
        if (!pendingRequest.documents) {
          pendingRequest.documents = [];
        }
        pendingRequest.documents.push(document);
      }
      
      if (state.selectedRequest?.id === requestId) {
        if (!state.selectedRequest.documents) {
          state.selectedRequest.documents = [];
        }
        state.selectedRequest.documents.push(document);
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

    // Fetch pending requests
    builder
      .addCase(fetchPendingRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPendingRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingRequests = action.payload;
      })
      .addCase(fetchPendingRequests.rejected, (state, action) => {
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
        
        // Add to pending requests if status is pending
        if (transformedRequest.status === RequestStatus.PENDING) {
          state.pendingRequests.unshift(transformedRequest);
        }
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
        
        // Update in all arrays
        const requestIndex = state.requests.findIndex(req => req.id === updatedRequest.id);
        if (requestIndex !== -1) {
          state.requests[requestIndex] = transformedRequest;
        }
        
        const userRequestIndex = state.userRequests.findIndex(req => req.id === updatedRequest.id);
        if (userRequestIndex !== -1) {
          state.userRequests[userRequestIndex] = transformedRequest;
        }
        
        // Update pending requests
        const pendingIndex = state.pendingRequests.findIndex(req => req.id === updatedRequest.id);
        if (pendingIndex !== -1) {
          if (transformedRequest.status === RequestStatus.PENDING) {
            state.pendingRequests[pendingIndex] = transformedRequest;
          } else {
            state.pendingRequests.splice(pendingIndex, 1);
          }
        } else if (transformedRequest.status === RequestStatus.PENDING) {
          state.pendingRequests.unshift(transformedRequest);
        }
        
        // Update selected request if it's the same
        if (state.selectedRequest?.id === updatedRequest.id) {
          state.selectedRequest = transformedRequest;
        }
      })
      .addCase(updateRequestStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Approve request
    builder
      .addCase(approveRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(approveRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        const approvedRequest = action.payload;
        
        // Transform and update the request
        const transformedRequest = {
          ...approvedRequest,
          status: RequestStatus.APPROVED,
          userId: approvedRequest.requesterId,
          priority: 'medium' as any,
          category: 'access' as any,
          title: `Access request for ${approvedRequest.doorName}`,
          description: approvedRequest.reason || 'No description provided',
        };
        
        // Update in all arrays
        const requestIndex = state.requests.findIndex(req => req.id === approvedRequest.id);
        if (requestIndex !== -1) {
          state.requests[requestIndex] = transformedRequest;
        }
        
        const userRequestIndex = state.userRequests.findIndex(req => req.id === approvedRequest.id);
        if (userRequestIndex !== -1) {
          state.userRequests[userRequestIndex] = transformedRequest;
        }
        
        // Remove from pending requests
        const pendingIndex = state.pendingRequests.findIndex(req => req.id === approvedRequest.id);
        if (pendingIndex !== -1) {
          state.pendingRequests.splice(pendingIndex, 1);
        }
        
        // Update selected request if it's the same
        if (state.selectedRequest?.id === approvedRequest.id) {
          state.selectedRequest = transformedRequest;
        }
      })
      .addCase(approveRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Deny request
    builder
      .addCase(denyRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(denyRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        const deniedRequest = action.payload;
        
        // Transform and update the request
        const transformedRequest = {
          ...deniedRequest,
          status: RequestStatus.DENIED,
          userId: deniedRequest.requesterId,
          priority: 'medium' as any,
          category: 'access' as any,
          title: `Access request for ${deniedRequest.doorName}`,
          description: deniedRequest.reason || 'No description provided',
        };
        
        // Update in all arrays
        const requestIndex = state.requests.findIndex(req => req.id === deniedRequest.id);
        if (requestIndex !== -1) {
          state.requests[requestIndex] = transformedRequest;
        }
        
        const userRequestIndex = state.userRequests.findIndex(req => req.id === deniedRequest.id);
        if (userRequestIndex !== -1) {
          state.userRequests[userRequestIndex] = transformedRequest;
        }
        
        // Remove from pending requests
        const pendingIndex = state.pendingRequests.findIndex(req => req.id === deniedRequest.id);
        if (pendingIndex !== -1) {
          state.pendingRequests.splice(pendingIndex, 1);
        }
        
        // Update selected request if it's the same
        if (state.selectedRequest?.id === deniedRequest.id) {
          state.selectedRequest = transformedRequest;
        }
      })
      .addCase(denyRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Upload document
    builder
      .addCase(uploadDocument.fulfilled, (state, action) => {
        const { requestId, document } = action.payload;
        
        // Add document to the request
        const request = state.requests.find(req => req.id === requestId);
        if (request) {
          if (!request.documents) {
            request.documents = [];
          }
          request.documents.push(document);
        }
        
        // Update in other arrays
        const userRequest = state.userRequests.find(req => req.id === requestId);
        if (userRequest) {
          if (!userRequest.documents) {
            userRequest.documents = [];
          }
          userRequest.documents.push(document);
        }
        
        const pendingRequest = state.pendingRequests.find(req => req.id === requestId);
        if (pendingRequest) {
          if (!pendingRequest.documents) {
            pendingRequest.documents = [];
          }
          pendingRequest.documents.push(document);
        }
        
        if (state.selectedRequest?.id === requestId) {
          if (!state.selectedRequest.documents) {
            state.selectedRequest.documents = [];
          }
          state.selectedRequest.documents.push(document);
        }
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
  updateRequest,
  removeRequest,
  addDocumentToRequest,
} = requestSlice.actions;

export default requestSlice.reducer;
