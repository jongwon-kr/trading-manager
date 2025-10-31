"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import type { CandlestickData } from "lightweight-charts"

interface BinanceKline {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export function useBinanceData(interval = "15m") {
  const [candles, setCandles] = useState<CandlestickData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout>()
  const lastUpdateRef = useRef<number>(0)

  const fetchKlines = useCallback(async () => {
    try {
      const response = await fetch(
        `https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=${interval}&limit=500`,
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const formattedCandles: CandlestickData[] = data.map((kline: any) => ({
        time: Math.floor(kline[0] / 1000) as any,
        open: Number.parseFloat(kline[1]),
        high: Number.parseFloat(kline[2]),
        low: Number.parseFloat(kline[3]),
        close: Number.parseFloat(kline[4]),
      }))

      setCandles(formattedCandles)
      setIsLoading(false)
      setError(null)
      lastUpdateRef.current = Date.now()

      console.log("[v0] Fetched", formattedCandles.length, "candles for interval:", interval)
    } catch (err) {
      console.error("[v0] Error fetching klines:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch data")
      setIsLoading(false)
    }
  }, [interval])

  useEffect(() => {
    // Initial fetch
    fetchKlines()

    // Set up polling - update every 5 seconds for short intervals, 30 seconds for longer ones
    const pollInterval = ["1m", "3m", "5m"].includes(interval) ? 5000 : 30000

    intervalRef.current = setInterval(() => {
      fetchKlines()
    }, pollInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [interval, fetchKlines])

  return {
    candles,
    isLoading,
    error,
    lastUpdate: lastUpdateRef.current,
  }
}

export function useBinanceVolume(interval = "15m") {
  const [volumeData, setVolumeData] = useState<Array<{ time: number; value: number; color: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout>()

  const fetchVolume = useCallback(async () => {
    try {
      const response = await fetch(
        `https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=${interval}&limit=500`,
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      const formattedVolume = data.map((kline: any, index: number, arr: any[]) => {
        const close = Number.parseFloat(kline[4])
        const prevClose = index > 0 ? Number.parseFloat(arr[index - 1][4]) : close

        return {
          time: Math.floor(kline[0] / 1000),
          value: Number.parseFloat(kline[5]),
          color: close >= prevClose ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.5)",
        }
      })

      setVolumeData(formattedVolume)
      setIsLoading(false)
    } catch (err) {
      console.error("[v0] Error fetching volume:", err)
      setIsLoading(false)
    }
  }, [interval])

  useEffect(() => {
    fetchVolume()

    const pollInterval = ["1m", "3m", "5m"].includes(interval) ? 5000 : 30000

    intervalRef.current = setInterval(() => {
      fetchVolume()
    }, pollInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [interval, fetchVolume])

  return { volumeData, isLoading }
}
