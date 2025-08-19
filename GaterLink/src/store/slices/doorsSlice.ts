import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Door, ScanHistory } from '../../types';

interface DoorsState {
  savedDoors: Door[];
  scanHistory: ScanHistory[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DoorsState = {
  savedDoors: [],
  scanHistory: [],
  isLoading: false,
  error: null,
};

const doorsSlice = createSlice({
  name: 'doors',
  initialState,
  reducers: {
    setSavedDoors: (state, action: PayloadAction<Door[]>) => {
      state.savedDoors = action.payload;
    },
    addSavedDoor: (state, action: PayloadAction<Door>) => {
      state.savedDoors.push(action.payload);
    },
    removeSavedDoor: (state, action: PayloadAction<string>) => {
      state.savedDoors = state.savedDoors.filter(d => d.id !== action.payload);
    },
    updateDoorLastAccessed: (state, action: PayloadAction<{ id: string; timestamp: Date }>) => {
      const door = state.savedDoors.find(d => d.id === action.payload.id);
      if (door) {
        door.lastAccessed = action.payload.timestamp;
      }
    },
    setScanHistory: (state, action: PayloadAction<ScanHistory[]>) => {
      state.scanHistory = action.payload;
    },
    addScanHistory: (state, action: PayloadAction<ScanHistory>) => {
      state.scanHistory.unshift(action.payload);
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
  setSavedDoors,
  addSavedDoor,
  removeSavedDoor,
  updateDoorLastAccessed,
  setScanHistory,
  addScanHistory,
  setLoading,
  setError,
} = doorsSlice.actions;

export default doorsSlice.reducer;