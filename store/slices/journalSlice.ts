import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export interface JournalEntry {
  id: string
  symbol: string
  type: "LONG" | "SHORT"
  entryPrice: number
  exitPrice?: number
  quantity: number
  leverage: number
  entryTime: number
  exitTime?: number
  pnl?: number
  pnlPercent?: number
  notes?: string
  status: "OPEN" | "CLOSED"
}

interface JournalState {
  entries: JournalEntry[]
}

const initialState: JournalState = {
  entries: [],
}

const journalSlice = createSlice({
  name: "journal",
  initialState,
  reducers: {
    addEntry: (state, action: PayloadAction<JournalEntry>) => {
      state.entries.unshift(action.payload)
    },
    updateEntry: (state, action: PayloadAction<JournalEntry>) => {
      const index = state.entries.findIndex((e) => e.id === action.payload.id)
      if (index !== -1) {
        state.entries[index] = action.payload
      }
    },
    deleteEntry: (state, action: PayloadAction<string>) => {
      state.entries = state.entries.filter((e) => e.id !== action.payload)
    },
    setEntries: (state, action: PayloadAction<JournalEntry[]>) => {
      state.entries = action.payload
    },
  },
})

export const { addEntry, updateEntry, deleteEntry, setEntries } = journalSlice.actions
export default journalSlice.reducer
