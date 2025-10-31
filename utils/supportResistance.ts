import type { Candle, SupportResistanceLevel } from "@/types/trading"

export function detectSupportResistance(candles: Candle[], tolerance = 0.005): SupportResistanceLevel[] {
  const levels: SupportResistanceLevel[] = []
  const recentCandles = candles.slice(-200)

  // Collect all significant price levels (highs and lows)
  const priceLevels: number[] = []
  recentCandles.forEach((candle) => {
    priceLevels.push(candle.high, candle.low)
  })

  // Group similar price levels
  const clusters: { price: number; count: number }[] = []

  priceLevels.forEach((price) => {
    let foundCluster = false

    for (const cluster of clusters) {
      if (Math.abs(price - cluster.price) / cluster.price < tolerance) {
        cluster.price = (cluster.price * cluster.count + price) / (cluster.count + 1)
        cluster.count++
        foundCluster = true
        break
      }
    }

    if (!foundCluster) {
      clusters.push({ price, count: 1 })
    }
  })

  // Filter significant levels (touched at least 3 times)
  const significantClusters = clusters.filter((c) => c.count >= 3)

  // Determine if level is support or resistance
  const currentPrice = recentCandles[recentCandles.length - 1].close

  significantClusters.forEach((cluster) => {
    const type = cluster.price < currentPrice ? "support" : "resistance"
    const strength = Math.min(cluster.count / 10, 1) // Normalize strength to 0-1

    levels.push({
      price: cluster.price,
      strength,
      touches: cluster.count,
      type,
    })
  })

  // Sort by strength
  return levels.sort((a, b) => b.strength - a.strength).slice(0, 10)
}
