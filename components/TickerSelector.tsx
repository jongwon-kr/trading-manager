"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import type { BinanceTicker } from "@/hooks/useBinanceTickers"

interface TickerSelectorProps {
  tickers: BinanceTicker[]
  selectedSymbol: string
  onSelectSymbol: (symbol: string) => void
}

export function TickerSelector({ tickers, selectedSymbol, onSelectSymbol }: TickerSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const filteredTickers = useMemo(() => {
    if (!searchQuery) return tickers.slice(0, 50) // Show first 50 by default
    return tickers.filter((ticker) => ticker.symbol.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 50)
  }, [tickers, searchQuery])

  const handleSelect = (symbol: string) => {
    onSelectSymbol(symbol)
    setIsOpen(false)
    setSearchQuery("")
  }

  return (
    <div className="relative">
      <Button onClick={() => setIsOpen(!isOpen)} variant="outline" className="w-full justify-between">
        <span className="font-semibold">{selectedSymbol}</span>
        <span className="text-xs text-gray-500 ml-2">▼</span>
      </Button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="티커 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-80">
            {filteredTickers.map((ticker) => (
              <button
                key={ticker.symbol}
                onClick={() => handleSelect(ticker.symbol)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${
                  ticker.symbol === selectedSymbol ? "bg-blue-50 font-semibold" : ""
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{ticker.symbol}</span>
                  <span className="text-xs text-gray-500">{ticker.baseAsset}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
