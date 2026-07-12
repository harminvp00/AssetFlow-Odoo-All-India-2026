import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient, { setClientToken, clearClientToken } from '../../../api/apiClient';

// Thunk: Login User
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { token, user } = response.data.data;
      setClientToken(token);
      return { token, user };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    }
  }
);

// Thunk: Register / Signup User
export const signupUser = createAsyncThunk(
  'auth/signup',
  async (userDetails, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/signup', userDetails);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Signup failed. Please try again.'
      );
    }
  }
);

// Thunk: Get Current Authenticated User profile
export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch user profile.'
      );
    }
  }
);

// Thunk: Refresh Token
export const refreshUserToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/refresh');
      const { token } = response.data.data;
      setClientToken(token);
      return token;
    } catch (error) {
      clearClientToken();
      return rejectWithValue(error.response?.data?.message || 'Session expired.');
    }
  }
);

// Thunk: Logout User
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue logout locally even if server call fails
    } finally {
      clearClientToken();
    }
  }
);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  isInitializing: true, // Prevents route flickering on page reload while checking auth
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Manual sync for Token refresh event listener
    syncToken: (state, action) => {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
      setClientToken(action.payload);
    },
    // Manual sync for Session expiration
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isInitializing = false;
      clearClientToken();
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // SIGNUP
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // FETCH PROFILE (ME)
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.isInitializing = false;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isInitializing = false;
      })

      // REFRESH TOKEN
      .addCase(refreshUserToken.fulfilled, (state, action) => {
        state.token = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(refreshUserToken.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isInitializing = false;
      })

      // LOGOUT
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.isInitializing = false;
      });
  },
});

export const { syncToken, clearAuth, clearError } = authSlice.actions;
export default authSlice.reducer;
