"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import type { CandlestickData } from "lightweight-charts"

interface BinanceKlineWS {
  e: string
  E: number
  s: string
  k: {
    t: number
    T: number
    s: string
    i: string
    f: number
    L: number
    o: string
    c: string
    h: string
    l: string
    v: string
    n: number
    x: boolean
    q: string
    V: string
    Q: string
    B: string
  }
}

export function useBinanceWebSocket(symbol: string, interval: string) {
  const [candles, setCandles] = useState<CandlestickData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5
  const hasInitialDataRef = useRef(false)
  const isLoadingHistoricalRef = useRef(false)
  const currentSymbolRef = useRef<string>("")
  const currentIntervalRef = useRef<string>("")

  const loadHistoricalData = useCallback(
    async (beforeTimestamp: number) => {
      if (isLoadingHistoricalRef.current) return
      isLoadingHistoricalRef.current = true

      try {
        console.log(`[v0] Loading historical data before ${beforeTimestamp}`)
        const response = await fetch(
          `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&endTime=${beforeTimestamp * 1000}&limit=500`,
        )

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.length > 0) {
          const formattedCandles: CandlestickData[] = data.map((kline: any) => ({
            time: Math.floor(kline[0] / 1000) as any,
            open: Number.parseFloat(kline[1]),
            high: Number.parseFloat(kline[2]),
            low: Number.parseFloat(kline[3]),
            close: Number.parseFloat(kline[4]),
          }))

          setCandles((prev) => {
            const existingTimes = new Set(prev.map((c) => (typeof c.time === "number" ? c.time : c.time.valueOf())))
            const newCandles = formattedCandles.filter(
              (c) => !existingTimes.has(typeof c.time === "number" ? c.time : c.time.valueOf()),
            )
            return [...newCandles, ...prev].sort((a, b) => {
              const aTime = typeof a.time === "number" ? a.time : a.time.valueOf()
              const bTime = typeof b.time === "number" ? b.time : b.time.valueOf()
              return aTime - bTime
            })
          })

          console.log(`[v0] Loaded ${formattedCandles.length} historical candles`)
        } else {
          console.log("[v0] No more historical data available")
        }
      } catch (err) {
        console.error("[v0] Error loading historical data:", err)
      } finally {
        isLoadingHistoricalRef.current = false
      }
    },
    [symbol, interval],
  )

  const fetchInitialData = useCallback(async () => {
    try {
      console.log(`[v0] Fetching initial data for ${symbol} ${interval}`)
      const response = await fetch(
        `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=500`,
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
      hasInitialDataRef.current = true
      setIsLoading(false)
      setError(null)
      console.log(`[v0] Loaded ${formattedCandles.length} initial candles`)
    } catch (err) {
      console.error("[v0] Error fetching initial data:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch initial data")
      setIsLoading(false)
    }
  }, [symbol, interval])

  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        console.log("[v0] Closing existing WebSocket before reconnecting")
        wsRef.current.close()
        wsRef.current = null
      }
    }

    const wsUrl = `wss://fstream.binance.com/ws/${symbol.toLowerCase()}@kline_${interval}`
    console.log(`[v0] Connecting to WebSocket: ${wsUrl}`)

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log("[v0] WebSocket connected successfully")
        setIsConnected(true)
        setError(null)
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const message: BinanceKlineWS = JSON.parse(event.data)

          if (message.e === "kline" && message.k) {
            const kline = message.k
            const newCandle: CandlestickData = {
              time: Math.floor(kline.t / 1000) as any,
              open: Number.parseFloat(kline.o),
              high: Number.parseFloat(kline.h),
              low: Number.parseFloat(kline.l),
              close: Number.parseFloat(kline.c),
            }

            setCandles((prev) => {
              if (prev.length === 0) return [newCandle]

              const lastCandle = prev[prev.length - 1]
              const lastTime = typeof lastCandle.time === "number" ? lastCandle.time : lastCandle.time.valueOf()
              const newTime = typeof newCandle.time === "number" ? newCandle.time : newCandle.time.valueOf()

              if (lastTime === newTime) {
                return [...prev.slice(0, -1), newCandle]
              } else if (newTime > lastTime) {
                return [...prev, newCandle]
              }
              return prev
            })
          }
        } catch (err) {
          console.error("[v0] Error parsing WebSocket message:", err)
        }
      }

      ws.onerror = (event) => {
        console.error("[v0] WebSocket error:", event)
        setError("WebSocket connection error")
        setIsConnected(false)
      }

      ws.onclose = (event) => {
        console.log(`[v0] WebSocket closed: code=${event.code}, reason=${event.reason}`)
        setIsConnected(false)
        wsRef.current = null

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          console.log(`[v0] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`)

          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket()
          }, delay)
        } else {
          setError("WebSocket connection failed after multiple attempts. Using REST API fallback.")
        }
      }
    } catch (err) {
      console.error("[v0] Error creating WebSocket:", err)
      setError("Failed to create WebSocket connection")
      setIsConnected(false)
    }
  }, [symbol, interval])

  useEffect(() => {
    console.log(`[v0] Symbol/Interval changed to ${symbol} ${interval}, clearing old data`)
    setCandles([])
    setIsLoading(true)
    setIsConnected(false)
    setError(null)
    hasInitialDataRef.current = false
    reconnectAttemptsRef.current = 0
    currentSymbolRef.current = symbol
    currentIntervalRef.current = interval

    fetchInitialData().then(() => {
      connectWebSocket()
    })

    return () => {
      console.log(`[v0] Cleaning up WebSocket connection for ${symbol} ${interval}`)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = undefined
      }
      if (wsRef.current) {
        console.log(`[v0] Closing WebSocket connection for ${symbol} ${interval}`)
        wsRef.current.close()
        wsRef.current = null
      }
      setIsConnected(false)
    }
  }, [symbol, interval, fetchInitialData, connectWebSocket])

  return {
    candles,
    isLoading,
    isConnected,
    error,
    loadHistoricalData,
  }
}

export function useBinanceVolumeWebSocket(symbol: string, interval: string) {
  const [volumeData, setVolumeData] = useState<Array<{ time: number; value: number; color: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const fetchInitialVolume = useCallback(async () => {
    try {
      const response = await fetch(
        `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=500`,
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
      console.error("[v0] Error fetching initial volume:", err)
      setIsLoading(false)
    }
  }, [symbol, interval])

  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close()
        wsRef.current = null
      }
    }

    const wsUrl = `wss://fstream.binance.com/ws/${symbol.toLowerCase()}@kline_${interval}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const message: BinanceKlineWS = JSON.parse(event.data)

        if (message.e === "kline" && message.k) {
          const kline = message.k
          const volume = Number.parseFloat(kline.v)
          const close = Number.parseFloat(kline.c)
          const time = Math.floor(kline.t / 1000)

          setVolumeData((prev) => {
            if (prev.length === 0) {
              return [{ time, value: volume, color: "rgba(34, 197, 94, 0.5)" }]
            }

            const lastVolume = prev[prev.length - 1]
            const prevClose = prev.length > 1 ? prev[prev.length - 2].value : close

            const newVolume = {
              time,
              value: volume,
              color: close >= prevClose ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.5)",
            }

            if (lastVolume.time === time) {
              return [...prev.slice(0, -1), newVolume]
            } else if (time > lastVolume.time) {
              return [...prev, newVolume]
            }
            return prev
          })
        }
      } catch (err) {
        console.error("[v0] Error parsing volume WebSocket message:", err)
      }
    }

    ws.onerror = (event) => {
      console.error("[v0] Volume WebSocket error:", event)
    }

    ws.onclose = () => {
      wsRef.current = null
    }
  }, [symbol, interval])

  useEffect(() => {
    console.log(`[v0] Volume: Symbol/Interval changed to ${symbol} ${interval}, clearing old data`)
    setVolumeData([])
    setIsLoading(true)

    fetchInitialVolume().then(() => {
      connectWebSocket()
    })

    return () => {
      console.log(`[v0] Cleaning up volume WebSocket for ${symbol} ${interval}`)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = undefined
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [symbol, interval, fetchInitialVolume, connectWebSocket])

  return { volumeData, isLoading }
}
