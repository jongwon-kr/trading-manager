import type { Candle, IndicatorData, Divergence, VolumeData } from "@/types/trading"

export function detectRSIDivergence(candles: Candle[], rsiData: IndicatorData[], lookback = 50): Divergence[] {
  const divergences: Divergence[] = []
  if (candles.length < lookback || rsiData.length < lookback) return divergences

  const recentCandles = candles.slice(-lookback)
  const recentRSI = rsiData.slice(-lookback)

  // Find price swing highs and lows
  for (let i = 2; i < recentCandles.length - 2; i++) {
    const priceHigh = recentCandles[i].high
    const priceLow = recentCandles[i].low
    const rsiValue = recentRSI[i]?.value

    if (!rsiValue) continue

    // Check for swing high
    if (
      priceHigh > recentCandles[i - 1].high &&
      priceHigh > recentCandles[i - 2].high &&
      priceHigh > recentCandles[i + 1].high &&
      priceHigh > recentCandles[i + 2].high
    ) {
      // Look for previous swing high
      for (let j = i - 5; j >= 2; j--) {
        const prevPriceHigh = recentCandles[j].high
        const prevRSI = recentRSI[j]?.value

        if (!prevRSI) continue

        if (
          prevPriceHigh > recentCandles[j - 1].high &&
          prevPriceHigh > recentCandles[j - 2].high &&
          prevPriceHigh > recentCandles[j + 1].high &&
          prevPriceHigh > recentCandles[j + 2].high
        ) {
          // Bearish divergence: price makes higher high, RSI makes lower high
          if (priceHigh > prevPriceHigh && rsiValue < prevRSI) {
            divergences.push({
              type: "bearish",
              indicator: "RSI",
              startIndex: candles.length - lookback + j,
              endIndex: candles.length - lookback + i,
              strength: "regular",
            })
          }
          break
        }
      }
    }

    // Check for swing low
    if (
      priceLow < recentCandles[i - 1].low &&
      priceLow < recentCandles[i - 2].low &&
      priceLow < recentCandles[i + 1].low &&
      priceLow < recentCandles[i + 2].low
    ) {
      // Look for previous swing low
      for (let j = i - 5; j >= 2; j--) {
        const prevPriceLow = recentCandles[j].low
        const prevRSI = recentRSI[j]?.value

        if (!prevRSI) continue

        if (
          prevPriceLow < recentCandles[j - 1].low &&
          prevPriceLow < recentCandles[j - 2].low &&
          prevPriceLow < recentCandles[j + 1].low &&
          prevPriceLow < recentCandles[j + 2].low
        ) {
          // Bullish divergence: price makes lower low, RSI makes higher low
          if (priceLow < prevPriceLow && rsiValue > prevRSI) {
            divergences.push({
              type: "bullish",
              indicator: "RSI",
              startIndex: candles.length - lookback + j,
              endIndex: candles.length - lookback + i,
              strength: "regular",
            })
          }
          break
        }
      }
    }
  }

  return divergences
}

export function detectVolumeDivergence(candles: Candle[], volumeData: VolumeData[], lookback = 50): Divergence[] {
  const divergences: Divergence[] = []
  if (candles.length < lookback || volumeData.length < lookback) return divergences

  const recentCandles = candles.slice(-lookback)
  const recentVolume = volumeData.slice(-lookback)

  for (let i = 2; i < recentCandles.length - 2; i++) {
    const priceHigh = recentCandles[i].high
    const volume = recentVolume[i]?.value

    if (!volume) continue

    // Check for swing high with decreasing volume (bearish)
    if (
      priceHigh > recentCandles[i - 1].high &&
      priceHigh > recentCandles[i - 2].high &&
      priceHigh > recentCandles[i + 1].high
    ) {
      for (let j = i - 5; j >= 2; j--) {
        const prevPriceHigh = recentCandles[j].high
        const prevVolume = recentVolume[j]?.value

        if (!prevVolume) continue

        if (
          prevPriceHigh > recentCandles[j - 1].high &&
          prevPriceHigh > recentCandles[j - 2].high &&
          prevPriceHigh > recentCandles[j + 1].high
        ) {
          // Price higher high, volume lower high = bearish divergence
          if (priceHigh > prevPriceHigh && volume < prevVolume) {
            divergences.push({
              type: "bearish",
              indicator: "Volume",
              startIndex: candles.length - lookback + j,
              endIndex: candles.length - lookback + i,
              strength: "regular",
            })
          }
          break
        }
      }
    }
  }

  return divergences
}
