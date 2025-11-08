import { configureStore } from '@reduxjs/toolkit';
import graphReducer from './graphSlice';

export const store = configureStore({
  reducer: {
    // This is where we register our slice
    graph: graphReducer,
  },
  // --- Key Fix for React Flow ---
  // React Flow stores data (like nodes) that isn't
  // "serializable" (plain text). This middleware
  // tells Redux to not worry about it.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// These are standard TypeScript types for Redux
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;