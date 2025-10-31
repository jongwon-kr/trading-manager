export interface Candle {
  time: number
  open: number
  high: number
  low: number
  close: number
}

export interface VolumeData {
  time: number
  value: number
  color: string
}

export interface IndicatorData {
  time: number
  value: number
}

export interface EngulfingCandle {
  index: number
  type: "bullish" | "bearish"
  candle: Candle
}

export interface TradingSignal {
  type: "bullish" | "bearish" | null
  entry: number
  sl: number
  tps: number[]
  time?: number
}

export interface DerivedData {
  sma5Data: IndicatorData[]
  sma20Data: IndicatorData[]
  sma60Data: IndicatorData[]
  sma120Data: IndicatorData[]
  rsiData: IndicatorData[]
  upperChannel: IndicatorData[]
  lowerChannel: IndicatorData[]
  bollingerUpper: IndicatorData[]
  bollingerMiddle: IndicatorData[]
  bollingerLower: IndicatorData[]
}

export interface PositionEntry {
  entry: number
  stopLoss: number
  takeProfit1: number
  takeProfit2: number
  takeProfit3: number
}

export type FibonacciLevels = Record<number, number>

export interface OrderBlock {
  high: number
  low: number
  type: "bullish" | "bearish"
  time: number
}

export interface Divergence {
  type: "bullish" | "bearish"
  indicator: "RSI" | "MACD" | "Volume"
  startIndex: number
  endIndex: number
  strength: "regular" | "hidden"
}

export interface SwingPoint {
  index: number
  time: number
  price: number
  type: "high" | "low"
}

export interface SupportResistanceLevel {
  price: number
  strength: number
  touches: number
  type: "support" | "resistance"
}

export interface ChartPattern {
  type: "head_and_shoulders" | "inverse_head_and_shoulders" | "double_top" | "double_bottom" | "triangle" | "flag"
  startIndex: number
  endIndex: number
  neckline?: number
  target?: number
}

export interface AdvancedAnalysis {
  divergences: Divergence[]
  swingPoints: SwingPoint[]
  supportResistance: SupportResistanceLevel[]
  patterns: ChartPattern[]
  marketStructure: "uptrend" | "downtrend" | "ranging"
}

export interface TradeJournalEntry {
  id: string
  symbol: string
  interval: string
  entryTime: number
  entryPrice: number
  exitTime?: number
  exitPrice?: number
  type: "long" | "short"
  stopLoss: number
  takeProfit: number[]
  leverage: number
  positionSize: number
  pnl?: number
  pnlPercent?: number
  status: "open" | "closed" | "stopped"
  notes: string
  tags: string[]
  screenshot?: string
}
