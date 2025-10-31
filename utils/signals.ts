import type {
  Candle,
  VolumeData,
  IndicatorData,
  EngulfingCandle,
  TradingSignal,
  FibonacciLevels,
  AdvancedAnalysis,
} from "@/types/trading"
import { detectRSIDivergence, detectVolumeDivergence } from "./divergence"
import { detectSwingPoints, detectDoubleTop, detectDoubleBottom, analyzeMarketStructure } from "./patterns"
import { detectSupportResistance } from "./supportResistance"

export function detectEngulfingCandles(klineData: Candle[]): EngulfingCandle[] {
  const engulfingCandles: EngulfingCandle[] = []

  for (let i = 1; i < klineData.length; i++) {
    const prev = klineData[i - 1]
    const curr = klineData[i]
    if (!prev || !curr) continue

    const prevBodyHigh = Math.max(prev.open, prev.close)
    const prevBodyLow = Math.min(prev.open, prev.close)
    const currBodyHigh = Math.max(curr.open, curr.close)
    const currBodyLow = Math.min(curr.open, curr.close)
    const isPrevRed = prev.open > prev.close
    const isCurrGreen = curr.open < curr.close

    if (isPrevRed && isCurrGreen && currBodyHigh > prevBodyHigh && currBodyLow < prevBodyLow) {
      engulfingCandles.push({ index: i, type: "bullish", candle: curr })
    } else if (!isPrevRed && !isCurrGreen && currBodyLow < prevBodyLow && currBodyHigh > prevBodyHigh) {
      engulfingCandles.push({ index: i, type: "bearish", candle: curr })
    }
  }

  return engulfingCandles
}

export function calculateFibonacciLevels(klineData: Candle[]): FibonacciLevels {
  const recentData = klineData.slice(-200)
  if (recentData.length === 0) return {}

  let highestHigh = Number.NEGATIVE_INFINITY
  let lowestLow = Number.POSITIVE_INFINITY
  let highTime = 0
  let lowTime = 0

  let initIdx = 0
  while (initIdx < recentData.length && (!recentData[initIdx] || recentData[initIdx].high === undefined)) {
    initIdx++
  }
  if (initIdx === recentData.length) return {}

  highestHigh = recentData[initIdx].high
  lowestLow = recentData[initIdx].low
  highTime = recentData[initIdx].time
  lowTime = recentData[initIdx].time

  for (let i = initIdx + 1; i < recentData.length; i++) {
    const d = recentData[i]
    if (d && d.high !== undefined && d.high > highestHigh) {
      highestHigh = d.high
      highTime = d.time
    }
    if (d && d.low !== undefined && d.low < lowestLow) {
      lowestLow = d.low
      lowTime = d.time
    }
  }

  const isUptrend = highTime > lowTime
  const startPrice = isUptrend ? lowestLow : highestHigh
  const endPrice = isUptrend ? highestHigh : lowestLow
  const diff = endPrice - startPrice

  const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]
  const fibPrices: FibonacciLevels = {}

  levels.forEach((level) => {
    fibPrices[level] = startPrice + diff * level
  })

  return fibPrices
}

export function generateAdvancedAnalysis(
  klineData: Candle[],
  volumeData: VolumeData[],
  rsiData: IndicatorData[],
): AdvancedAnalysis {
  // Detect divergences
  const rsiDivergences = detectRSIDivergence(klineData, rsiData)
  const volumeDivergences = detectVolumeDivergence(klineData, volumeData)
  const divergences = [...rsiDivergences, ...volumeDivergences]

  // Detect swing points and patterns
  const swingPoints = detectSwingPoints(klineData)
  const doubleTopPatterns = detectDoubleTop(klineData, swingPoints)
  const doubleBottomPatterns = detectDoubleBottom(klineData, swingPoints)
  const patterns = [...doubleTopPatterns, ...doubleBottomPatterns]

  // Detect support and resistance
  const supportResistance = detectSupportResistance(klineData)

  // Analyze market structure
  const marketStructure = analyzeMarketStructure(swingPoints)

  return {
    divergences,
    swingPoints,
    supportResistance,
    patterns,
    marketStructure,
  }
}

export function generateTradingSignal(
  klineData: Candle[],
  volumeData: VolumeData[],
  sma5: IndicatorData[],
  sma20: IndicatorData[],
  sma60: IndicatorData[],
  sma120: IndicatorData[],
  rsi: IndicatorData[],
  engulfingCandles: EngulfingCandle[],
  bollingerUpper: IndicatorData[],
  bollingerLower: IndicatorData[],
  advancedAnalysis?: AdvancedAnalysis,
): {
  signal: TradingSignal
  bullishScore: number
  bearishScore: number
  bullishReasons: string[]
  bearishReasons: string[]
} {
  let bullishScore = 0
  let bearishScore = 0
  const bullishReasons: string[] = []
  const bearishReasons: string[] = []

  const lastCandle = klineData[klineData.length - 1]
  if (!lastCandle)
    return {
      signal: { type: null, entry: 0, sl: 0, tps: [] },
      bullishScore,
      bearishScore,
      bullishReasons,
      bearishReasons,
    }

  const lastSma5 = sma5[sma5.length - 1]?.value
  const lastSma20 = sma20[sma20.length - 1]?.value
  const lastSma60 = sma60[sma60.length - 1]?.value
  const lastSma120 = sma120[sma120.length - 1]?.value
  const lastRsi = rsi[rsi.length - 1]?.value
  const lastBollingerUpper = bollingerUpper[bollingerUpper.length - 1]?.value
  const lastBollingerLower = bollingerLower[bollingerLower.length - 1]?.value

  if (advancedAnalysis) {
    // Market structure
    if (advancedAnalysis.marketStructure === "uptrend") {
      bullishScore += 2
      bullishReasons.push("시장 구조: 상승 추세 (HH, HL)")
    } else if (advancedAnalysis.marketStructure === "downtrend") {
      bearishScore += 2
      bearishReasons.push("시장 구조: 하락 추세 (LH, LL)")
    }

    // Divergences
    const recentDivergences = advancedAnalysis.divergences.filter((d) => d.endIndex > klineData.length - 20)
    recentDivergences.forEach((div) => {
      if (div.type === "bullish") {
        bullishScore += 2
        bullishReasons.push(`${div.indicator} 상승 다이버전스 감지`)
      } else {
        bearishScore += 2
        bearishReasons.push(`${div.indicator} 하락 다이버전스 감지`)
      }
    })

    // Support/Resistance
    const nearSupport = advancedAnalysis.supportResistance.find(
      (sr) => sr.type === "support" && Math.abs(lastCandle.close - sr.price) / sr.price < 0.01,
    )
    const nearResistance = advancedAnalysis.supportResistance.find(
      (sr) => sr.type === "resistance" && Math.abs(lastCandle.close - sr.price) / sr.price < 0.01,
    )

    if (nearSupport) {
      bullishScore++
      bullishReasons.push(`강력한 지지선 근처 (${nearSupport.price.toFixed(2)})`)
    }
    if (nearResistance) {
      bearishScore++
      bearishReasons.push(`강력한 저항선 근처 (${nearResistance.price.toFixed(2)})`)
    }

    // Patterns
    const recentPatterns = advancedAnalysis.patterns.filter((p) => p.endIndex > klineData.length - 50)
    recentPatterns.forEach((pattern) => {
      if (pattern.type === "double_bottom") {
        bullishScore += 2
        bullishReasons.push("더블 바텀 패턴 감지")
      } else if (pattern.type === "double_top") {
        bearishScore += 2
        bearishReasons.push("더블 탑 패턴 감지")
      }
    })
  }

  // SMA alignment
  if (lastSma5 && lastSma20 && lastSma60 && lastSma120) {
    if (lastSma5 > lastSma20 && lastSma20 > lastSma60 && lastSma60 > lastSma120) {
      bullishScore++
      bullishReasons.push("SMA 정배열 (5>20>60>120)")
    } else if (lastSma5 < lastSma20 && lastSma20 < lastSma60 && lastSma60 < lastSma120) {
      bearishScore++
      bearishReasons.push("SMA 역배열 (5<20<60<120)")
    }
  }

  // Price vs SMA5
  if (lastSma5) {
    if (lastCandle.close > lastSma5) {
      bullishScore++
      bullishReasons.push("가격 > 5 SMA")
    }
    if (lastCandle.close < lastSma5) {
      bearishScore++
      bearishReasons.push("가격 < 5 SMA")
    }
  }

  // RSI
  if (lastRsi) {
    if (lastRsi < 30) {
      bullishScore++
      bullishReasons.push("RSI 과매도 (30↓)")
    }
    if (lastRsi > 70) {
      bearishScore++
      bearishReasons.push("RSI 과매수 (70↑)")
    }
  }

  if (lastBollingerUpper && lastBollingerLower) {
    if (lastCandle.close <= lastBollingerLower) {
      bullishScore++
      bullishReasons.push("볼린저 밴드 하단 터치 (과매도)")
    }
    if (lastCandle.close >= lastBollingerUpper) {
      bearishScore++
      bearishReasons.push("볼린저 밴드 상단 터치 (과매수)")
    }
  }

  const mostRecentEngulfing = engulfingCandles.length > 0 ? engulfingCandles[engulfingCandles.length - 1] : null
  let signal: TradingSignal = { type: null, entry: 0, sl: 0, tps: [] }

  if (mostRecentEngulfing && mostRecentEngulfing.index > klineData.length - 52) {
    if (mostRecentEngulfing.type === "bullish") {
      const entryPrice = mostRecentEngulfing.candle.close
      const stopLossPrice = mostRecentEngulfing.candle.low
      const risk = entryPrice - stopLossPrice

      const tp1 = entryPrice + risk * 1
      const tp2 = entryPrice + risk * 2
      const tp3 = entryPrice + risk * 3

      signal = {
        type: "bullish",
        entry: entryPrice,
        sl: stopLossPrice,
        tps: [tp1, tp2, tp3],
        time: mostRecentEngulfing.candle.time,
      }
    } else if (mostRecentEngulfing.type === "bearish") {
      const entryPrice = mostRecentEngulfing.candle.close
      const stopLossPrice = mostRecentEngulfing.candle.high
      const risk = stopLossPrice - entryPrice

      const tp1 = entryPrice - risk * 1
      const tp2 = entryPrice - risk * 2
      const tp3 = entryPrice - risk * 3

      signal = {
        type: "bearish",
        entry: entryPrice,
        sl: stopLossPrice,
        tps: [tp1, tp2, tp3],
        time: mostRecentEngulfing.candle.time,
      }
    }
  }

  return { signal, bullishScore, bearishScore, bullishReasons, bearishReasons }
}
