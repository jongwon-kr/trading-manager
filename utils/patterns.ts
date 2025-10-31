import type { Candle, ChartPattern, SwingPoint } from "@/types/trading"

export function detectSwingPoints(candles: Candle[], lookback = 5): SwingPoint[] {
  const swingPoints: SwingPoint[] = []

  for (let i = lookback; i < candles.length - lookback; i++) {
    const current = candles[i]
    let isSwingHigh = true
    let isSwingLow = true

    // Check if current candle is a swing high
    for (let j = 1; j <= lookback; j++) {
      if (current.high <= candles[i - j].high || current.high <= candles[i + j].high) {
        isSwingHigh = false
        break
      }
    }

    // Check if current candle is a swing low
    for (let j = 1; j <= lookback; j++) {
      if (current.low >= candles[i - j].low || current.low >= candles[i + j].low) {
        isSwingLow = false
        break
      }
    }

    if (isSwingHigh) {
      swingPoints.push({
        index: i,
        time: current.time,
        price: current.high,
        type: "high",
      })
    }

    if (isSwingLow) {
      swingPoints.push({
        index: i,
        time: current.time,
        price: current.low,
        type: "low",
      })
    }
  }

  return swingPoints
}

export function detectDoubleTop(candles: Candle[], swingPoints: SwingPoint[]): ChartPattern[] {
  const patterns: ChartPattern[] = []
  const highs = swingPoints.filter((p) => p.type === "high")

  for (let i = 1; i < highs.length; i++) {
    const first = highs[i - 1]
    const second = highs[i]

    // Check if two highs are similar (within 2%)
    const priceDiff = Math.abs(first.price - second.price) / first.price
    if (priceDiff < 0.02) {
      // Find the low between the two highs
      const candlesBetween = candles.slice(first.index, second.index + 1)
      const neckline = Math.min(...candlesBetween.map((c) => c.low))
      const target = neckline - (first.price - neckline)

      patterns.push({
        type: "double_top",
        startIndex: first.index,
        endIndex: second.index,
        neckline,
        target,
      })
    }
  }

  return patterns
}

export function detectDoubleBottom(candles: Candle[], swingPoints: SwingPoint[]): ChartPattern[] {
  const patterns: ChartPattern[] = []
  const lows = swingPoints.filter((p) => p.type === "low")

  for (let i = 1; i < lows.length; i++) {
    const first = lows[i - 1]
    const second = lows[i]

    // Check if two lows are similar (within 2%)
    const priceDiff = Math.abs(first.price - second.price) / first.price
    if (priceDiff < 0.02) {
      // Find the high between the two lows
      const candlesBetween = candles.slice(first.index, second.index + 1)
      const neckline = Math.max(...candlesBetween.map((c) => c.high))
      const target = neckline + (neckline - first.price)

      patterns.push({
        type: "double_bottom",
        startIndex: first.index,
        endIndex: second.index,
        neckline,
        target,
      })
    }
  }

  return patterns
}

export function analyzeMarketStructure(swingPoints: SwingPoint[]): "uptrend" | "downtrend" | "ranging" {
  if (swingPoints.length < 4) return "ranging"

  const recentSwings = swingPoints.slice(-6)
  const highs = recentSwings.filter((p) => p.type === "high")
  const lows = recentSwings.filter((p) => p.type === "low")

  if (highs.length < 2 || lows.length < 2) return "ranging"

  // Check for higher highs and higher lows (uptrend)
  const isHigherHighs = highs[highs.length - 1].price > highs[highs.length - 2].price
  const isHigherLows = lows[lows.length - 1].price > lows[lows.length - 2].price

  // Check for lower highs and lower lows (downtrend)
  const isLowerHighs = highs[highs.length - 1].price < highs[highs.length - 2].price
  const isLowerLows = lows[lows.length - 1].price < lows[lows.length - 2].price

  if (isHigherHighs && isHigherLows) return "uptrend"
  if (isLowerHighs && isLowerLows) return "downtrend"
  return "ranging"
}
