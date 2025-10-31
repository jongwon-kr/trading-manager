"use client"

import { useState, useEffect } from "react"
import type { TradeJournalEntry } from "@/types/trading"

const STORAGE_KEY = "trading_journal_entries"

export function useTradingJournal() {
  const [entries, setEntries] = useState<TradeJournalEntry[]>([])

  // Load entries from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setEntries(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to parse trading journal:", e)
      }
    }
  }, [])

  // Save entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }, [entries])

  const addEntry = (entry: Omit<TradeJournalEntry, "id">) => {
    const newEntry: TradeJournalEntry = {
      ...entry,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    }
    setEntries((prev) => [newEntry, ...prev])
    return newEntry.id
  }

  const updateEntry = (id: string, updates: Partial<TradeJournalEntry>) => {
    setEntries((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry)))
  }

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  const closeEntry = (id: string, exitPrice: number, exitTime: number) => {
    setEntries((prev) =>
      prev.map((entry) => {
        if (entry.id === id) {
          const pnl =
            entry.type === "long"
              ? (exitPrice - entry.entryPrice) * entry.positionSize * entry.leverage
              : (entry.entryPrice - exitPrice) * entry.positionSize * entry.leverage

          const pnlPercent = (pnl / (entry.positionSize * entry.leverage)) * 100

          return {
            ...entry,
            exitPrice,
            exitTime,
            pnl,
            pnlPercent,
            status: "closed" as const,
          }
        }
        return entry
      }),
    )
  }

  const getStats = () => {
    const closedTrades = entries.filter((e) => e.status === "closed")
    const totalTrades = closedTrades.length
    const winningTrades = closedTrades.filter((e) => (e.pnl ?? 0) > 0).length
    const losingTrades = closedTrades.filter((e) => (e.pnl ?? 0) < 0).length
    const totalPnL = closedTrades.reduce((sum, e) => sum + (e.pnl ?? 0), 0)
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      totalPnL,
      winRate,
    }
  }

  return {
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    closeEntry,
    getStats,
  }
}
