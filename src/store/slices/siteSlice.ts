import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SiteState, Site, SiteStatus, PremiumFeature } from '../../types';
import { siteService } from '../../services/siteService';

// ============================================================================
// ASYNC THUNKS
// ============================================================================

export const fetchSites = createAsyncThunk(
  'sites/fetchSites',
  async (_, { rejectWithValue }) => {
    try {
      const sites = await siteService.getSites();
      return sites;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sites');
    }
  }
);

export const fetchSiteById = createAsyncThunk(
  'sites/fetchSiteById',
  async (siteId: string, { rejectWithValue }) => {
    try {
      const site = await siteService.getSiteById(siteId);
      return site;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch site');
    }
  }
);

export const createSite = createAsyncThunk(
  'sites/createSite',
  async (siteData: Partial<Site>, { rejectWithValue }) => {
    try {
      const site = await siteService.createSite(siteData);
      return site;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create site');
    }
  }
);

export const updateSite = createAsyncThunk(
  'sites/updateSite',
  async ({ siteId, updates }: { siteId: string; updates: Partial<Site> }, { rejectWithValue }) => {
    try {
      const site = await siteService.updateSite(siteId, updates);
      return site;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update site');
    }
  }
);

export const deleteSite = createAsyncThunk(
  'sites/deleteSite',
  async (siteId: string, { rejectWithValue }) => {
    try {
      await siteService.deleteSite(siteId);
      return siteId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete site');
    }
  }
);

export const fetchUserSites = createAsyncThunk(
  'sites/fetchUserSites',
  async (_, { rejectWithValue }) => {
    try {
      const sites = await siteService.getUserSites();
      return sites;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch user sites');
    }
  }
);

export const setSiteStatus = createAsyncThunk(
  'sites/setSiteStatus',
  async ({ siteId, status }: { siteId: string; status: SiteStatus }, { rejectWithValue }) => {
    try {
      const site = await siteService.setSiteStatus(siteId, status);
      return site;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to set site status');
    }
  }
);

export const enablePremiumFeature = createAsyncThunk(
  'sites/enablePremiumFeature',
  async ({ siteId, feature }: { siteId: string; feature: PremiumFeature }, { rejectWithValue }) => {
    try {
      const site = await siteService.enablePremiumFeature(siteId, feature);
      return site;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to enable premium feature');
    }
  }
);

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: SiteState = {
  sites: [],
  selectedSite: null,
  isLoading: false,
  error: null,
  userSites: [],
};

// ============================================================================
// SITE SLICE
// ============================================================================

const siteSlice = createSlice({
  name: 'sites',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedSite: (state, action: PayloadAction<Site | null>) => {
      state.selectedSite = action.payload;
    },
    clearSelectedSite: (state) => {
      state.selectedSite = null;
    },
    addSite: (state, action: PayloadAction<Site>) => {
      state.sites.unshift(action.payload);
      state.userSites.unshift(action.payload);
    },
    updateSiteInState: (state, action: PayloadAction<Site>) => {
      const updatedSite = action.payload;
      
      // Update in sites array
      const siteIndex = state.sites.findIndex(site => site.id === updatedSite.id);
      if (siteIndex !== -1) {
        state.sites[siteIndex] = updatedSite;
      }
      
      // Update in userSites array
      const userSiteIndex = state.userSites.findIndex(site => site.id === updatedSite.id);
      if (userSiteIndex !== -1) {
        state.userSites[userSiteIndex] = updatedSite;
      }
      
      // Update selected site if it's the same
      if (state.selectedSite?.id === updatedSite.id) {
        state.selectedSite = updatedSite;
      }
    },
    removeSite: (state, action: PayloadAction<string>) => {
      const siteId = action.payload;
      
      state.sites = state.sites.filter(site => site.id !== siteId);
      state.userSites = state.userSites.filter(site => site.id !== siteId);
      
      if (state.selectedSite?.id === siteId) {
        state.selectedSite = null;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch sites
    builder
      .addCase(fetchSites.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSites.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sites = action.payload;
      })
      .addCase(fetchSites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch site by ID
    builder
      .addCase(fetchSiteById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSiteById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedSite = action.payload;
      })
      .addCase(fetchSiteById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create site
    builder
      .addCase(createSite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createSite.fulfilled, (state, action) => {
        state.isLoading = false;
        const newSite = action.payload;
        state.sites.unshift(newSite);
        state.userSites.unshift(newSite);
      })
      .addCase(createSite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update site
    builder
      .addCase(updateSite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSite.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedSite = action.payload;
        
        // Update in sites array
        const siteIndex = state.sites.findIndex(site => site.id === updatedSite.id);
        if (siteIndex !== -1) {
          state.sites[siteIndex] = updatedSite;
        }
        
        // Update in userSites array
        const userSiteIndex = state.userSites.findIndex(site => site.id === updatedSite.id);
        if (userSiteIndex !== -1) {
          state.userSites[userSiteIndex] = updatedSite;
        }
        
        // Update selected site if it's the same
        if (state.selectedSite?.id === updatedSite.id) {
          state.selectedSite = updatedSite;
        }
      })
      .addCase(updateSite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Delete site
    builder
      .addCase(deleteSite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteSite.fulfilled, (state, action) => {
        state.isLoading = false;
        const siteId = action.payload;
        
        state.sites = state.sites.filter(site => site.id !== siteId);
        state.userSites = state.userSites.filter(site => site.id !== siteId);
        
        if (state.selectedSite?.id === siteId) {
          state.selectedSite = null;
        }
      })
      .addCase(deleteSite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch user sites
    builder
      .addCase(fetchUserSites.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserSites.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userSites = action.payload;
      })
      .addCase(fetchUserSites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Set site status
    builder
      .addCase(setSiteStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setSiteStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedSite = action.payload;
        
        // Update in sites array
        const siteIndex = state.sites.findIndex(site => site.id === updatedSite.id);
        if (siteIndex !== -1) {
          state.sites[siteIndex] = updatedSite;
        }
        
        // Update in userSites array
        const userSiteIndex = state.userSites.findIndex(site => site.id === updatedSite.id);
        if (userSiteIndex !== -1) {
          state.userSites[userSiteIndex] = updatedSite;
        }
        
        // Update selected site if it's the same
        if (state.selectedSite?.id === updatedSite.id) {
          state.selectedSite = updatedSite;
        }
      })
      .addCase(setSiteStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Enable premium feature
    builder
      .addCase(enablePremiumFeature.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(enablePremiumFeature.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedSite = action.payload;
        
        // Update in sites array
        const siteIndex = state.sites.findIndex(site => site.id === updatedSite.id);
        if (siteIndex !== -1) {
          state.sites[siteIndex] = updatedSite;
        }
        
        // Update in userSites array
        const userSiteIndex = state.userSites.findIndex(site => site.id === updatedSite.id);
        if (userSiteIndex !== -1) {
          state.userSites[userSiteIndex] = updatedSite;
        }
        
        // Update selected site if it's the same
        if (state.selectedSite?.id === updatedSite.id) {
          state.selectedSite = updatedSite;
        }
      })
      .addCase(enablePremiumFeature.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearError,
  setSelectedSite,
  clearSelectedSite,
  addSite,
  updateSiteInState,
  removeSite,
} = siteSlice.actions;

export default siteSlice.reducer;
