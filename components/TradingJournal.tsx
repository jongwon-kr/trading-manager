"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTradingJournal } from "@/hooks/useTradingJournal"

interface TradingJournalProps {
  symbol: string
  interval: string
  currentPrice: number
}

export function TradingJournal({ symbol, interval, currentPrice }: TradingJournalProps) {
  const { entries, addEntry, closeEntry, deleteEntry, getStats } = useTradingJournal()
  const [showForm, setShowForm] = useState(false)

  const [formData, setFormData] = useState({
    type: "long" as "long" | "short",
    entryPrice: "",
    stopLoss: "",
    takeProfit: "",
    leverage: "10",
    positionSize: "",
    notes: "",
  })

  const stats = getStats()

  const handleSubmit = () => {
    const entry = Number.parseFloat(formData.entryPrice) || currentPrice
    const sl = Number.parseFloat(formData.stopLoss)
    const tp = Number.parseFloat(formData.takeProfit)
    const leverage = Number.parseFloat(formData.leverage)
    const positionSize = Number.parseFloat(formData.positionSize)

    if (!sl || !tp || !leverage || !positionSize) {
      alert("모든 필드를 입력해주세요.")
      return
    }

    addEntry({
      symbol,
      interval,
      entryTime: Date.now(),
      entryPrice: entry,
      type: formData.type,
      stopLoss: sl,
      takeProfit: [tp],
      leverage,
      positionSize,
      status: "open",
      notes: formData.notes,
      tags: [],
    })

    setFormData({
      type: "long",
      entryPrice: "",
      stopLoss: "",
      takeProfit: "",
      leverage: "10",
      positionSize: "",
      notes: "",
    })
    setShowForm(false)
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">매매 일지</h3>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          {showForm ? "취소" : "+ 새 거래"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-gray-600">총 거래</div>
          <div className="font-bold">{stats.totalTrades}</div>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-gray-600">승률</div>
          <div className="font-bold">{stats.winRate.toFixed(1)}%</div>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-gray-600">총 손익</div>
          <div className={`font-bold ${stats.totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}>
            {stats.totalPnL >= 0 ? "+" : ""}
            {stats.totalPnL.toFixed(2)} USDT
          </div>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-gray-600">승/패</div>
          <div className="font-bold">
            {stats.winningTrades}/{stats.losingTrades}
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="space-y-3 mb-4 border-t pt-4">
          <div className="flex gap-2">
            <Button
              onClick={() => setFormData({ ...formData, type: "long" })}
              variant={formData.type === "long" ? "default" : "outline"}
              size="sm"
              className="flex-1"
            >
              롱
            </Button>
            <Button
              onClick={() => setFormData({ ...formData, type: "short" })}
              variant={formData.type === "short" ? "default" : "outline"}
              size="sm"
              className="flex-1"
            >
              숏
            </Button>
          </div>

          <div>
            <Label>진입가</Label>
            <Input
              type="number"
              placeholder={currentPrice.toFixed(2)}
              value={formData.entryPrice}
              onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
            />
          </div>

          <div>
            <Label>손절가</Label>
            <Input
              type="number"
              value={formData.stopLoss}
              onChange={(e) => setFormData({ ...formData, stopLoss: e.target.value })}
            />
          </div>

          <div>
            <Label>목표가</Label>
            <Input
              type="number"
              value={formData.takeProfit}
              onChange={(e) => setFormData({ ...formData, takeProfit: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>레버리지</Label>
              <Input
                type="number"
                value={formData.leverage}
                onChange={(e) => setFormData({ ...formData, leverage: e.target.value })}
              />
            </div>
            <div>
              <Label>포지션 크기</Label>
              <Input
                type="number"
                value={formData.positionSize}
                onChange={(e) => setFormData({ ...formData, positionSize: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>메모</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="거래 이유, 전략 등..."
              rows={3}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full">
            거래 기록
          </Button>
        </div>
      )}

      {/* Entries List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {entries.slice(0, 10).map((entry) => (
          <div key={entry.id} className="border rounded p-3 text-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className={`font-bold ${entry.type === "long" ? "text-green-600" : "text-red-600"}`}>
                  {entry.type === "long" ? "롱" : "숏"}
                </span>
                <span className="ml-2 text-gray-600">
                  {entry.symbol} {entry.interval}
                </span>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  entry.status === "open"
                    ? "bg-blue-100 text-blue-700"
                    : entry.status === "closed"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {entry.status === "open" ? "진행중" : entry.status === "closed" ? "청산" : "손절"}
              </span>
            </div>

            <div className="text-xs text-gray-600 space-y-1">
              <div>진입: {entry.entryPrice.toFixed(2)} USDT</div>
              {entry.exitPrice && <div>청산: {entry.exitPrice.toFixed(2)} USDT</div>}
              <div>손절: {entry.stopLoss.toFixed(2)} USDT</div>
              {entry.pnl !== undefined && (
                <div className={`font-bold ${entry.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                  손익: {entry.pnl >= 0 ? "+" : ""}
                  {entry.pnl.toFixed(2)} USDT ({entry.pnlPercent?.toFixed(2)}%)
                </div>
              )}
              {entry.notes && <div className="italic">"{entry.notes}"</div>}
            </div>

            <div className="flex gap-2 mt-2">
              {entry.status === "open" && (
                <Button
                  onClick={() => closeEntry(entry.id, currentPrice, Date.now())}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  현재가로 청산
                </Button>
              )}
              <Button
                onClick={() => deleteEntry(entry.id)}
                size="sm"
                variant="outline"
                className="text-xs text-red-600"
              >
                삭제
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
