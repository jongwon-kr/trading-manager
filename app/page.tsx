"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { TradingChart, type TradingChartHandle } from "@/components/TradingChart"
import { VolumeChart, type VolumeChartHandle } from "@/components/VolumeChart"
import { RSIChart, type RSIChartHandle } from "@/components/RSIChart"
import { AnalysisPanel } from "@/components/AnalysisPanel"
import { TradingJournal } from "@/components/TradingJournal"
import { TickerSelector } from "@/components/TickerSelector"
import { Button } from "@/components/ui/button"
import { useBinanceWebSocket, useBinanceVolumeWebSocket } from "@/hooks/useBinanceWebSocket"
import { useBinanceTickers } from "@/hooks/useBinanceTickers"
import { calculateDerivedData } from "@/utils/indicators"
import { detectEngulfingCandles, generateTradingSignal, generateAdvancedAnalysis } from "@/utils/signals"
import type { Candle, EngulfingCandle, TradingSignal, DerivedData, AdvancedAnalysis } from "@/types/trading"
import { useToast } from "@/hooks/use-toast"
import type { LogicalRange } from "lightweight-charts"
import { RotateCcw } from "lucide-react"

export default function TradingManager() {
  const [symbol, setSymbol] = useState("BTCUSDT")
  const [interval, setInterval] = useState("1h")
  const [derivedData, setDerivedData] = useState<DerivedData>({
    sma5Data: [],
    sma20Data: [],
    sma60Data: [],
    sma120Data: [],
    rsiData: [],
    upperChannel: [],
    lowerChannel: [],
    bollingerUpper: [],
    bollingerMiddle: [],
    bollingerLower: [],
  })
  const [engulfingCandles, setEngulfingCandles] = useState<EngulfingCandle[]>([])
  const [signal, setSignal] = useState<TradingSignal>({ type: null, entry: 0, sl: 0, tps: [] })
  const [advancedAnalysis, setAdvancedAnalysis] = useState<AdvancedAnalysis | null>(null)
  const [bullishScore, setBullishScore] = useState(0)
  const [bearishScore, setBearishScore] = useState(0)
  const [bullishReasons, setBullishReasons] = useState<string[]>([])
  const [bearishReasons, setBearishReasons] = useState<string[]>([])
  const [showSMA, setShowSMA] = useState(true)
  const [showDonchian, setShowDonchian] = useState(true)
  const [showBollinger, setShowBollinger] = useState(true)
  const [showChart, setShowChart] = useState(true)
  const [showVolume, setShowVolume] = useState(true)
  const [showRSI, setShowRSI] = useState(true)
  const [showJournal, setShowJournal] = useState(false)

  const chartRef = useRef<TradingChartHandle>(null)
  const volumeChartRef = useRef<VolumeChartHandle>(null)
  const rsiChartRef = useRef<RSIChartHandle>(null)
  const isSyncingRef = useRef(false)

  const { toast } = useToast()

  const { tickers, isLoading: tickersLoading } = useBinanceTickers()
  const {
    candles: chartData,
    isLoading,
    isConnected,
    error,
    loadHistoricalData,
  } = useBinanceWebSocket(symbol, interval)
  const { volumeData, isLoading: volumeLoading } = useBinanceVolumeWebSocket(symbol, interval)

  useEffect(() => {
    console.log(`[v0] Resetting analysis state for ${symbol} ${interval}`)
    setDerivedData({
      sma5Data: [],
      sma20Data: [],
      sma60Data: [],
      sma120Data: [],
      rsiData: [],
      upperChannel: [],
      lowerChannel: [],
      bollingerUpper: [],
      bollingerMiddle: [],
      bollingerLower: [],
    })
    setEngulfingCandles([])
    setSignal({ type: null, entry: 0, sl: 0, tps: [] })
    setAdvancedAnalysis(null)
    setBullishScore(0)
    setBearishScore(0)
    setBullishReasons([])
    setBearishReasons([])
  }, [symbol, interval])

  useEffect(() => {
    if (!isLoading && chartData.length > 0) {
      setTimeout(() => {
        chartRef.current?.fitContent()
        volumeChartRef.current?.fitContent()
        rsiChartRef.current?.fitContent()
      }, 300)
    }
  }, [interval, isLoading, chartData.length])

  const convertedChartData: Candle[] = useMemo(() => {
    return chartData.map((c) => ({
      time: c.time as number,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }))
  }, [chartData])

  const currentPrice = useMemo(() => {
    if (convertedChartData.length > 0) {
      return convertedChartData[convertedChartData.length - 1].close
    }
    return 0
  }, [convertedChartData])

  useEffect(() => {
    if (convertedChartData.length > 0 && volumeData.length > 0) {
      const derived = calculateDerivedData(convertedChartData)
      setDerivedData(derived)

      const engulfing = detectEngulfingCandles(convertedChartData)
      setEngulfingCandles(engulfing)

      const advanced = generateAdvancedAnalysis(convertedChartData, volumeData, derived.rsiData)
      setAdvancedAnalysis(advanced)

      const {
        signal: newSignal,
        bullishScore: bs,
        bearishScore: brs,
        bullishReasons: br,
        bearishReasons: brr,
      } = generateTradingSignal(
        convertedChartData,
        volumeData,
        derived.sma5Data,
        derived.sma20Data,
        derived.sma60Data,
        derived.sma120Data,
        derived.rsiData,
        engulfing,
        derived.bollingerUpper,
        derived.bollingerLower,
        advanced,
      )

      setSignal(newSignal)
      setBullishScore(bs)
      setBearishScore(brs)
      setBullishReasons(br)
      setBearishReasons(brr)
    }
  }, [convertedChartData, volumeData])

  useEffect(() => {
    if (error) {
      toast({
        title: "연결 오류",
        description: error,
        variant: "destructive",
      })
    }
  }, [error, toast])

  const handleMainChartTimeRangeChange = useCallback((range: LogicalRange | null) => {
    if (!range || isSyncingRef.current) return
    isSyncingRef.current = true
    volumeChartRef.current?.setVisibleLogicalRange(range)
    rsiChartRef.current?.setVisibleLogicalRange(range)
    setTimeout(() => {
      isSyncingRef.current = false
    }, 50)
  }, [])

  const handleVolumeChartTimeRangeChange = useCallback((range: LogicalRange | null) => {
    if (!range || isSyncingRef.current) return
    isSyncingRef.current = true
    chartRef.current?.setVisibleLogicalRange(range)
    rsiChartRef.current?.setVisibleLogicalRange(range)
    setTimeout(() => {
      isSyncingRef.current = false
    }, 50)
  }, [])

  const handleRSIChartTimeRangeChange = useCallback((range: LogicalRange | null) => {
    if (!range || isSyncingRef.current) return
    isSyncingRef.current = true
    chartRef.current?.setVisibleLogicalRange(range)
    volumeChartRef.current?.setVisibleLogicalRange(range)
    setTimeout(() => {
      isSyncingRef.current = false
    }, 50)
  }, [])

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol)
  }

  const handleResetCharts = () => {
    chartRef.current?.fitContent()
    volumeChartRef.current?.fitContent()
    rsiChartRef.current?.fitContent()
    toast({
      title: "차트 재정렬",
      description: "모든 차트가 재정렬되었습니다.",
    })
  }

  const handleLoadHistoricalData = useCallback(
    (firstTimestamp: number) => {
      if (loadHistoricalData) {
        loadHistoricalData(firstTimestamp)
      }
    },
    [loadHistoricalData],
  )

  const intervals = [
    { label: "주", value: "1w" },
    { label: "일", value: "1d" },
    { label: "4h", value: "4h" },
    { label: "1h", value: "1h" },
    { label: "15m", value: "15m" },
    { label: "5m", value: "5m" },
  ]

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">
      <main className="w-full lg:w-3/4 p-4">
        <header className="flex justify-between items-center mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Binance 선물 차트 (실시간 WebSocket)</h1>
            <p className="text-sm text-gray-600">
              실시간 WebSocket 연결 및 고급 기술적 분석
              {isConnected && <span className="ml-2 text-green-600 font-semibold">● 연결됨</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TickerSelector tickers={tickers} loading={tickersLoading} onChange={handleSymbolChange} value={symbol} />
            <Button onClick={handleResetCharts} variant="outline" size="icon" title="차트 재정렬">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setShowJournal(!showJournal)} variant="outline">
              {showJournal ? "차트 보기" : "매매 일지"}
            </Button>
          </div>
        </header>

        {!showJournal ? (
          <>
            {showChart && (
              <TradingChart
                ref={chartRef}
                data={convertedChartData}
                volumeData={volumeData}
                sma5Data={derivedData.sma5Data}
                sma20Data={derivedData.sma20Data}
                sma60Data={derivedData.sma60Data}
                sma120Data={derivedData.sma120Data}
                upperChannel={derivedData.upperChannel}
                lowerChannel={derivedData.lowerChannel}
                bollingerUpper={derivedData.bollingerUpper}
                bollingerMiddle={derivedData.bollingerMiddle}
                bollingerLower={derivedData.bollingerLower}
                engulfingMarkers={engulfingCandles}
                showSMA={showSMA}
                showDonchian={showDonchian}
                showBollinger={showBollinger}
                onVisibleRangeChange={handleLoadHistoricalData}
                onTimeRangeChange={handleMainChartTimeRangeChange}
              />
            )}
            {showVolume && (
              <VolumeChart
                ref={volumeChartRef}
                data={volumeData}
                onTimeRangeChange={handleVolumeChartTimeRangeChange}
              />
            )}
            {showRSI && (
              <RSIChart
                ref={rsiChartRef}
                data={derivedData.rsiData}
                onTimeRangeChange={handleRSIChartTimeRangeChange}
              />
            )}
          </>
        ) : (
          <TradingJournal symbol={symbol} currentPrice={currentPrice} />
        )}
      </main>

      <aside className="w-full lg:w-1/4 p-4 bg-white shadow-lg overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">시간봉 선택</h2>
          <div className="flex flex-wrap gap-2">
            {intervals.map((int) => (
              <Button
                key={int.value}
                variant={interval === int.value ? "default" : "outline"}
                size="sm"
                onClick={() => setInterval(int.value)}
              >
                {int.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">차트 표시 옵션</h2>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showSMA} onChange={(e) => setShowSMA(e.target.checked)} />
              <span className="text-sm">이동평균선 (SMA)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showDonchian} onChange={(e) => setShowDonchian(e.target.checked)} />
              <span className="text-sm">돈키언 채널</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showBollinger} onChange={(e) => setShowBollinger(e.target.checked)} />
              <span className="text-sm">볼린저 밴드</span>
            </label>
          </div>
        </div>

        <AnalysisPanel
          signal={signal}
          bullishScore={bullishScore}
          bearishScore={bearishScore}
          bullishReasons={bullishReasons}
          bearishReasons={bearishReasons}
          currentPrice={currentPrice}
        />
      </aside>
    </div>
  )
}
