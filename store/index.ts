import { configureStore } from "@reduxjs/toolkit"
import authReducer from "./slices/authSlice"
import tradingReducer from "./slices/tradingSlice"
import chartReducer from "./slices/chartSlice"
import journalReducer from "./slices/journalSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    trading: tradingReducer,
    chart: chartReducer,
    journal: journalReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
