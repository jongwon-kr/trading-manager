"use client"

import { useEffect, useState } from "react"

export interface BinanceTicker {
  symbol: string
  baseAsset: string
  quoteAsset: string
  status: string
}

export function useBinanceTickers() {
  const [tickers, setTickers] = useState<BinanceTicker[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTickers = async () => {
      try {
        console.log("[v0] Fetching Binance Futures tickers...")
        const response = await fetch("https://fapi.binance.com/fapi/v1/exchangeInfo")

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        // Filter for USDT perpetual contracts that are trading
        const usdtTickers: BinanceTicker[] = data.symbols
          .filter((s: any) => s.quoteAsset === "USDT" && s.contractType === "PERPETUAL" && s.status === "TRADING")
          .map((s: any) => ({
            symbol: s.symbol,
            baseAsset: s.baseAsset,
            quoteAsset: s.quoteAsset,
            status: s.status,
          }))
          .sort((a: BinanceTicker, b: BinanceTicker) => a.symbol.localeCompare(b.symbol))

        setTickers(usdtTickers)
        setIsLoading(false)
        console.log(`[v0] Loaded ${usdtTickers.length} USDT perpetual tickers`)
      } catch (err) {
        console.error("[v0] Error fetching tickers:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch tickers")
        setIsLoading(false)
      }
    }

    fetchTickers()
  }, [])

  return { tickers, isLoading, error }
}
