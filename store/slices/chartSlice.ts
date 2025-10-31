import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface ChartState {
  showSMA: boolean
  showDonchian: boolean
  showBollinger: boolean
  showChart: boolean
  showVolume: boolean
  showRSI: boolean
}

const initialState: ChartState = {
  showSMA: true,
  showDonchian: true,
  showBollinger: true,
  showChart: true,
  showVolume: true,
  showRSI: true,
}

const chartSlice = createSlice({
  name: "chart",
  initialState,
  reducers: {
    setShowSMA: (state, action: PayloadAction<boolean>) => {
      state.showSMA = action.payload
    },
    setShowDonchian: (state, action: PayloadAction<boolean>) => {
      state.showDonchian = action.payload
    },
    setShowBollinger: (state, action: PayloadAction<boolean>) => {
      state.showBollinger = action.payload
    },
    setShowChart: (state, action: PayloadAction<boolean>) => {
      state.showChart = action.payload
    },
    setShowVolume: (state, action: PayloadAction<boolean>) => {
      state.showVolume = action.payload
    },
    setShowRSI: (state, action: PayloadAction<boolean>) => {
      state.showRSI = action.payload
    },
  },
})

export const { setShowSMA, setShowDonchian, setShowBollinger, setShowChart, setShowVolume, setShowRSI } =
  chartSlice.actions
export default chartSlice.reducer
