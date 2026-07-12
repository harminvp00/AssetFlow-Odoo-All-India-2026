import { configureStore } from '@reduxjs/toolkit';

// Central Redux Toolkit store combining feature slices
const store = configureStore({
  reducer: {
    // Reducers from features/ slices will be registered here
    // Example:
    // auth: authReducer,
    // assets: assetsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
