import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/store/authSlice';
import auditsReducer from '../features/audits/store/auditsSlice';
import maintenanceReducer from '../features/maintenance/store/maintenanceSlice';
import reportsReducer from '../features/reports/store/reportsSlice';
import attachmentsReducer from '../features/attachments/store/attachmentsSlice';
import logsReducer from '../features/logs/store/logsSlice';

// Central Redux Toolkit store combining feature slices
const store = configureStore({
  reducer: {
    auth: authReducer,
    audits: auditsReducer,
    maintenance: maintenanceReducer,
    reports: reportsReducer,
    attachments: attachmentsReducer,
    logs: logsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
