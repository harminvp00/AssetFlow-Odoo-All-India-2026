import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/store/authSlice';

// Central Redux Toolkit store combining feature slices
const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
