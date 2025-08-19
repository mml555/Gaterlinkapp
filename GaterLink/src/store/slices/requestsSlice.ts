import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AccessRequest } from '../../types';

interface RequestsState {
  requests: AccessRequest[];
  isLoading: boolean;
  error: string | null;
}

const initialState: RequestsState = {
  requests: [],
  isLoading: false,
  error: null,
};

const requestsSlice = createSlice({
  name: 'requests',
  initialState,
  reducers: {
    setRequests: (state, action: PayloadAction<AccessRequest[]>) => {
      state.requests = action.payload;
    },
    addRequest: (state, action: PayloadAction<AccessRequest>) => {
      state.requests.unshift(action.payload);
    },
    updateRequest: (state, action: PayloadAction<AccessRequest>) => {
      const index = state.requests.findIndex(r => r.id === action.payload.id);
      if (index !== -1) {
        state.requests[index] = action.payload;
      }
    },
    removeRequest: (state, action: PayloadAction<string>) => {
      state.requests = state.requests.filter(r => r.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setRequests,
  addRequest,
  updateRequest,
  removeRequest,
  setLoading,
  setError,
} = requestsSlice.actions;

export default requestsSlice.reducer;