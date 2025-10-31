"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { TradingSignal } from "@/types/trading"

interface AnalysisPanelProps {
  signal: TradingSignal
  bullishScore: number
  bearishScore: number
  bullishReasons: string[]
  bearishReasons: string[]
  currentPrice: number
  onCalculatePosition: (entry: number, stopLoss: number, takeProfit: number, leverage: number, margin: number) => void
  onManualEntry: (
    entry: number,
    stopLoss: number,
    takeProfit1: number,
    takeProfit2: number,
    takeProfit3: number,
  ) => void
  onCalculateBNBFee: (positionSize: number) => void
}

export function AnalysisPanel({
  signal,
  bullishScore,
  bearishScore,
  bullishReasons,
  bearishReasons,
  currentPrice,
  onCalculatePosition,
  onManualEntry,
  onCalculateBNBFee,
}: AnalysisPanelProps) {
  const [posEntry, setPosEntry] = useState("")
  const [posStopLoss, setPosStopLoss] = useState("")
  const [posTakeProfit, setPosTakeProfit] = useState("")
  const [posLeverage, setPosLeverage] = useState("10")
  const [posMargin, setPosMargin] = useState("")

  const [manualEntry, setManualEntry] = useState("")
  const [manualStopLoss, setManualStopLoss] = useState("")
  const [manualTP1, setManualTP1] = useState("")
  const [manualTP2, setManualTP2] = useState("")
  const [manualTP3, setManualTP3] = useState("")

  const [bnbPositionSize, setBnbPositionSize] = useState("")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">분석 및 신호 (실시간)</h2>
      </div>

      {/* Trading Signal */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">단기 트레이딩 신호</h3>
        <div className="flex justify-around mb-3 text-center">
          <div>
            <span className="text-sm font-medium">상승 가중치</span>
            <p className="text-2xl font-bold text-green-500">{bullishScore}</p>
            <ul className="text-xs text-left list-disc list-inside text-gray-700 mt-1">
              {bullishReasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </div>
          <div>
            <span className="text-sm font-medium">하락 가중치</span>
            <p className="text-2xl font-bold text-red-500">{bearishScore}</p>
            <ul className="text-xs text-left list-disc list-inside text-gray-700 mt-1">
              {bearishReasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>

        {signal.type && (
          <div className="border-t border-gray-300 pt-3">
            <p className={`font-bold text-lg mb-1 ${signal.type === "bullish" ? "text-green-500" : "text-red-500"}`}>
              {signal.type === "bullish" ? "매수" : "매도"} 진입 추천 (최근 장악형)
            </p>
            <p className="text-xs text-gray-500 mb-2">
              신호 발생: {signal.time ? new Date(signal.time * 1000).toLocaleString("ko-KR") : "N/A"}
            </p>
            <p className="text-sm">
              <span className="font-medium">진입가 (신호 종가):</span> {signal.entry.toFixed(2)}
            </p>
            <p className={`text-sm font-medium ${signal.type === "bullish" ? "text-red-500" : "text-green-500"}`}>
              손절가 ({signal.type === "bullish" ? "신호 저가" : "신호 고가"}): {signal.sl.toFixed(2)}
            </p>
            <p className="text-sm font-medium mt-2">이익 실현 (TP) 추천:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              {signal.tps.length > 0 ? (
                signal.tps.map((tp, i) => (
                  <li key={i}>
                    <strong>TP {i + 1}:</strong> {tp.toFixed(2)} ({[40, 30, 30][i]}%)
                  </li>
                ))
              ) : (
                <li>목표가 없음 (현재가 최고가/최저가 근접)</li>
              )}
            </ul>
          </div>
        )}

        {!signal.type && (
          <div className="border-t border-gray-300 pt-3">
            <p className="font-medium text-lg text-gray-700">중립 (대기)</p>
            <p className="text-sm text-gray-500">최근 52캔들 내 장악형 신호 없음.</p>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <Tabs defaultValue="position" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="position">포지션 계산기</TabsTrigger>
            <TabsTrigger value="manual">수동 진입</TabsTrigger>
            <TabsTrigger value="bnb">BNB 수수료</TabsTrigger>
          </TabsList>

          <TabsContent value="position" className="space-y-3 mt-4">
            <h3 className="text-lg font-semibold">포지션 계산기</h3>
            <div className="space-y-2">
              <div>
                <Label htmlFor="pos-entry">진입가 (USDT):</Label>
                <Input
                  id="pos-entry"
                  type="number"
                  placeholder={`현재가: ${currentPrice.toFixed(2)}`}
                  value={posEntry}
                  onChange={(e) => setPosEntry(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pos-sl">손절가 (USDT):</Label>
                <Input
                  id="pos-sl"
                  type="number"
                  placeholder="예: 64000"
                  value={posStopLoss}
                  onChange={(e) => setPosStopLoss(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pos-tp">목표가 (USDT):</Label>
                <Input
                  id="pos-tp"
                  type="number"
                  placeholder="예: 68000"
                  value={posTakeProfit}
                  onChange={(e) => setPosTakeProfit(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pos-leverage">레버리지 (배):</Label>
                <Input
                  id="pos-leverage"
                  type="number"
                  placeholder="예: 10"
                  value={posLeverage}
                  onChange={(e) => setPosLeverage(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="pos-margin">증거금 (USDT):</Label>
                <Input
                  id="pos-margin"
                  type="number"
                  placeholder="예: 1000"
                  value={posMargin}
                  onChange={(e) => setPosMargin(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={() =>
                  onCalculatePosition(
                    Number.parseFloat(posEntry) || currentPrice,
                    Number.parseFloat(posStopLoss),
                    Number.parseFloat(posTakeProfit),
                    Number.parseFloat(posLeverage),
                    Number.parseFloat(posMargin),
                  )
                }
                className="w-full"
              >
                계산 및 차트 표시
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-3 mt-4">
            <h3 className="text-lg font-semibold">수동 진입 (R/R 계산)</h3>
            <div className="space-y-2">
              <div>
                <Label htmlFor="manual-entry">진입가 (USDT):</Label>
                <Input
                  id="manual-entry"
                  type="number"
                  placeholder={`현재가: ${currentPrice.toFixed(2)}`}
                  value={manualEntry}
                  onChange={(e) => setManualEntry(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="manual-sl">손절가 (USDT):</Label>
                <Input
                  id="manual-sl"
                  type="number"
                  placeholder="예: 64000"
                  value={manualStopLoss}
                  onChange={(e) => setManualStopLoss(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="manual-tp1">목표가 1 (USDT):</Label>
                <Input
                  id="manual-tp1"
                  type="number"
                  placeholder="예: 66000"
                  value={manualTP1}
                  onChange={(e) => setManualTP1(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="manual-tp2">목표가 2 (USDT):</Label>
                <Input
                  id="manual-tp2"
                  type="number"
                  placeholder="예: 67000"
                  value={manualTP2}
                  onChange={(e) => setManualTP2(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="manual-tp3">목표가 3 (USDT):</Label>
                <Input
                  id="manual-tp3"
                  type="number"
                  placeholder="예: 68000"
                  value={manualTP3}
                  onChange={(e) => setManualTP3(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={() =>
                  onManualEntry(
                    Number.parseFloat(manualEntry) || currentPrice,
                    Number.parseFloat(manualStopLoss),
                    Number.parseFloat(manualTP1),
                    Number.parseFloat(manualTP2),
                    Number.parseFloat(manualTP3),
                  )
                }
                className="w-full"
              >
                R/R 계산 및 차트 표시
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="bnb" className="space-y-3 mt-4">
            <h3 className="text-lg font-semibold">BNB 수수료 계산기 (10% 할인)</h3>
            <div className="space-y-2">
              <div>
                <Label htmlFor="bnb-position">포지션 크기 (USDT):</Label>
                <Input
                  id="bnb-position"
                  type="number"
                  placeholder="예: 10000"
                  value={bnbPositionSize}
                  onChange={(e) => setBnbPositionSize(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button onClick={() => onCalculateBNBFee(Number.parseFloat(bnbPositionSize))} className="w-full">
                필요 BNB 구매량 (USDT) 계산
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Notes */}
      <div className="text-xs text-gray-600 space-y-3">
        <h4 className="font-semibold text-sm">참고 사항 (Beta)</h4>
        <p>
          <strong>이동평균선 (SMA):</strong> 5(빨강), 20(파랑), 60(초록), 120(보라) 사용.
        </p>
        <p>
          <strong>볼린저 밴드 (20, 2σ):</strong> 20캔들 기간의 표준편차 기반 변동성 밴드 (보라색).
        </p>
        <p>
          <strong>돈키언 채널 (20):</strong> 20캔들 기간의 최고/최저가 터널 (회색 점선).
        </p>
        <p>
          <strong>RSI (14):</strong> 70 이상 과매수, 30 이하 과매도. (가중치에 반영)
        </p>
        <p>
          <strong>장악형 (Engulfing):</strong> 캔들 몸통이 이전 몸통을 덮을 때 차트에 ⬆, ⬇ 표시 (최근 10개).
        </p>
        <p>
          <strong>수수료:</strong> 포지션 계산기는 Taker 수수료 0.04% (진입/청산)를 가정합니다. BNB 계산기는 10% 할인을
          적용합니다.
        </p>
        <p className="font-bold mt-2 text-red-500">
          *본 정보는 교육용이며 투자 조언이 아닙니다. 실제 투자 결정에 대한 책임은 본인에게 있습니다.
        </p>
      </div>
    </div>
  )
}
