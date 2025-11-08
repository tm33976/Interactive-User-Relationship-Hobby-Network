import { configureStore } from "@reduxjs/toolkit";
import graphReducer from "./graphSlice";

export const store = configureStore({
  reducer: {
    // This is where we register our slice
    graph: graphReducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
