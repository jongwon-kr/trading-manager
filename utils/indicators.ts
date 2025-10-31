import type { Candle, IndicatorData, DerivedData } from "@/types/trading"

export const RSI_PERIOD = 14
export const SMA5_PERIOD = 5
export const SMA20_PERIOD = 20
export const SMA60_PERIOD = 60
export const SMA120_PERIOD = 120
export const DONCHIAN_PERIOD = 20
export const BOLLINGER_PERIOD = 20
export const BOLLINGER_STD_DEV = 2

export function calculateSMA(closesData: IndicatorData[], period: number): IndicatorData[] {
  const sma: IndicatorData[] = []
  if (closesData.length < period) return sma

  for (let i = period - 1; i < closesData.length; i++) {
    const slice = closesData.slice(i - period + 1, i + 1)
    const sum = slice.reduce((a, b) => a + b.value, 0)
    sma.push({ time: closesData[i].time, value: sum / period })
  }
  return sma
}

export function calculateRSI(klineData: Candle[], period: number): IndicatorData[] {
  const closes = klineData.map((d) => d.close)
  const gains: number[] = []
  const losses: number[] = []

  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1]
    gains.push(Math.max(0, change))
    losses.push(Math.max(0, -change))
  }

  if (gains.length < period) return []

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period

  const rsiValues: IndicatorData[] = []

  if (klineData[period]) {
    if (avgLoss === 0) {
      rsiValues.push({ time: klineData[period].time, value: 100 })
    } else {
      rsiValues.push({ time: klineData[period].time, value: 100 - 100 / (1 + avgGain / avgLoss) })
    }
  }

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    const rsi = 100 - 100 / (1 + rs)

    if (klineData[i + 1]) {
      rsiValues.push({ time: klineData[i + 1].time, value: rsi })
    }
  }
  return rsiValues
}

export function calculateDonchianChannels(klineData: Candle[], period: number) {
  const upperChannel: IndicatorData[] = []
  const lowerChannel: IndicatorData[] = []

  for (let i = period - 1; i < klineData.length; i++) {
    const slice = klineData.slice(i - period + 1, i + 1)
    let maxHigh = Number.NEGATIVE_INFINITY
    let minLow = Number.POSITIVE_INFINITY

    for (let j = 0; j < slice.length; j++) {
      if (slice[j].high > maxHigh) maxHigh = slice[j].high
      if (slice[j].low < minLow) minLow = slice[j].low
    }

    upperChannel.push({ time: klineData[i].time, value: maxHigh })
    lowerChannel.push({ time: klineData[i].time, value: minLow })
  }
  return { upperChannel, lowerChannel }
}

export function calculateBollingerBands(closesData: IndicatorData[], period: number, stdDev: number) {
  const upperBand: IndicatorData[] = []
  const middleBand: IndicatorData[] = []
  const lowerBand: IndicatorData[] = []

  if (closesData.length < period) return { upperBand, middleBand, lowerBand }

  for (let i = period - 1; i < closesData.length; i++) {
    const slice = closesData.slice(i - period + 1, i + 1)
    const sum = slice.reduce((a, b) => a + b.value, 0)
    const sma = sum / period

    const variance = slice.reduce((a, b) => a + Math.pow(b.value - sma, 2), 0) / period
    const std = Math.sqrt(variance)

    middleBand.push({ time: closesData[i].time, value: sma })
    upperBand.push({ time: closesData[i].time, value: sma + stdDev * std })
    lowerBand.push({ time: closesData[i].time, value: sma - stdDev * std })
  }

  return { upperBand, middleBand, lowerBand }
}

export function calculateDerivedData(klineData: Candle[]): DerivedData {
  const closesData = klineData.map((d) => ({ time: d.time, value: d.close }))
  const sma5Data = calculateSMA(closesData, SMA5_PERIOD)
  const sma20Data = calculateSMA(closesData, SMA20_PERIOD)
  const sma60Data = calculateSMA(closesData, SMA60_PERIOD)
  const sma120Data = calculateSMA(closesData, SMA120_PERIOD)
  const rsiData = klineData.length > RSI_PERIOD ? calculateRSI(klineData, RSI_PERIOD) : []
  const { upperChannel, lowerChannel } =
    klineData.length >= DONCHIAN_PERIOD
      ? calculateDonchianChannels(klineData, DONCHIAN_PERIOD)
      : { upperChannel: [], lowerChannel: [] }

  const { upperBand, middleBand, lowerBand } =
    klineData.length >= BOLLINGER_PERIOD
      ? calculateBollingerBands(closesData, BOLLINGER_PERIOD, BOLLINGER_STD_DEV)
      : { upperBand: [], middleBand: [], lowerBand: [] }

  return {
    sma5Data,
    sma20Data,
    sma60Data,
    sma120Data,
    rsiData,
    upperChannel,
    lowerChannel,
    bollingerUpper: upperBand,
    bollingerMiddle: middleBand,
    bollingerLower: lowerBand,
  }
}
