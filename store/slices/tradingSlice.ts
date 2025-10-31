import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { TradingSignal, DerivedData, AdvancedAnalysis, EngulfingCandle } from "@/types/trading"

interface TradingState {
  symbol: string
  interval: string
  derivedData: DerivedData
  engulfingCandles: EngulfingCandle[]
  visibleEngulfingCount: number
  signal: TradingSignal
  advancedAnalysis: AdvancedAnalysis | null
  bullishScore: number
  bearishScore: number
  bullishReasons: string[]
  bearishReasons: string[]
  currentPrice: number
}

const initialState: TradingState = {
  symbol: "BTCUSDT",
  interval: "1h",
  derivedData: {
    sma5Data: [],
    sma20Data: [],
    sma60Data: [],
    sma120Data: [],
    rsiData: [],
    upperChannel: [],
    lowerChannel: [],
    bollingerUpper: [],
    bollingerMiddle: [],
    bollingerLower: [],
  },
  engulfingCandles: [],
  visibleEngulfingCount: 10,
  signal: { type: null, entry: 0, sl: 0, tps: [] },
  advancedAnalysis: null,
  bullishScore: 0,
  bearishScore: 0,
  bullishReasons: [],
  bearishReasons: [],
  currentPrice: 0,
}

const tradingSlice = createSlice({
  name: "trading",
  initialState,
  reducers: {
    setSymbol: (state, action: PayloadAction<string>) => {
      state.symbol = action.payload
    },
    setInterval: (state, action: PayloadAction<string>) => {
      state.interval = action.payload
    },
    setDerivedData: (state, action: PayloadAction<DerivedData>) => {
      state.derivedData = action.payload
    },
    setEngulfingCandles: (state, action: PayloadAction<EngulfingCandle[]>) => {
      state.engulfingCandles = action.payload
    },
    setVisibleEngulfingCount: (state, action: PayloadAction<number>) => {
      state.visibleEngulfingCount = Math.max(10, action.payload)
    },
    incrementEngulfingCount: (state) => {
      state.visibleEngulfingCount += 5
    },
    decrementEngulfingCount: (state) => {
      state.visibleEngulfingCount = Math.max(10, state.visibleEngulfingCount - 5)
    },
    setSignal: (state, action: PayloadAction<TradingSignal>) => {
      state.signal = action.payload
    },
    setAdvancedAnalysis: (state, action: PayloadAction<AdvancedAnalysis | null>) => {
      state.advancedAnalysis = action.payload
    },
    setBullishScore: (state, action: PayloadAction<number>) => {
      state.bullishScore = action.payload
    },
    setBearishScore: (state, action: PayloadAction<number>) => {
      state.bearishScore = action.payload
    },
    setBullishReasons: (state, action: PayloadAction<string[]>) => {
      state.bullishReasons = action.payload
    },
    setBearishReasons: (state, action: PayloadAction<string[]>) => {
      state.bearishReasons = action.payload
    },
    setCurrentPrice: (state, action: PayloadAction<number>) => {
      state.currentPrice = action.payload
    },
    resetTradingState: (state) => {
      state.derivedData = initialState.derivedData
      state.engulfingCandles = []
      state.signal = initialState.signal
      state.advancedAnalysis = null
      state.bullishScore = 0
      state.bearishScore = 0
      state.bullishReasons = []
      state.bearishReasons = []
    },
  },
})

export const {
  setSymbol,
  setInterval,
  setDerivedData,
  setEngulfingCandles,
  setVisibleEngulfingCount,
  incrementEngulfingCount,
  decrementEngulfingCount,
  setSignal,
  setAdvancedAnalysis,
  setBullishScore,
  setBearishScore,
  setBullishReasons,
  setBearishReasons,
  setCurrentPrice,
  resetTradingState,
} = tradingSlice.actions
export default tradingSlice.reducer
