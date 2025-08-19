import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SyncState {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  pendingCount: number;
  syncError: string | null;
  isOnline: boolean;
}

const initialState: SyncState = {
  isSyncing: false,
  lastSyncTime: null,
  pendingCount: 0,
  syncError: null,
  isOnline: true,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    setLastSyncTime: (state, action: PayloadAction<Date>) => {
      state.lastSyncTime = action.payload;
    },
    setPendingCount: (state, action: PayloadAction<number>) => {
      state.pendingCount = action.payload;
    },
    setSyncError: (state, action: PayloadAction<string | null>) => {
      state.syncError = action.payload;
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
  },
});

export const {
  setSyncing,
  setLastSyncTime,
  setPendingCount,
  setSyncError,
  setOnlineStatus,
} = syncSlice.actions;

export default syncSlice.reducer;