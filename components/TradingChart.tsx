"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LineData,
  type Time,
  type LogicalRange,
} from "lightweight-charts"
import type { Candle, VolumeData, IndicatorData, EngulfingCandle } from "@/types/trading"

interface TradingChartProps {
  data: Candle[]
  volumeData: VolumeData[]
  sma5Data: IndicatorData[]
  sma20Data: IndicatorData[]
  sma60Data: IndicatorData[]
  sma120Data: IndicatorData[]
  upperChannel: IndicatorData[]
  lowerChannel: IndicatorData[]
  bollingerUpper: IndicatorData[]
  bollingerMiddle: IndicatorData[]
  bollingerLower: IndicatorData[]
  engulfingMarkers: EngulfingCandle[]
  showSMA: boolean
  showDonchian: boolean
  showBollinger: boolean
  onVisibleRangeChange?: (from: number) => void
  onTimeRangeChange?: (range: LogicalRange | null) => void
}

export interface TradingChartHandle {
  scrollToRealTime: () => void
  resetView: () => void
  fitContent: () => void
  createPriceLine: (price: number, color: string, lineWidth: number, lineStyle: number, title: string) => any
  removePriceLine: (line: any) => void
  setVisibleLogicalRange: (range: LogicalRange) => void
}

export const TradingChart = forwardRef<TradingChartHandle, TradingChartProps>(
  (
    {
      data,
      volumeData,
      sma5Data,
      sma20Data,
      sma60Data,
      sma120Data,
      upperChannel,
      lowerChannel,
      bollingerUpper,
      bollingerMiddle,
      bollingerLower,
      engulfingMarkers,
      showSMA,
      showDonchian,
      showBollinger,
      onVisibleRangeChange,
      onTimeRangeChange,
    },
    ref,
  ) => {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
    const sma5SeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
    const sma20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
    const sma60SeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
    const sma120SeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
    const donchianUpperRef = useRef<ISeriesApi<"Line"> | null>(null)
    const donchianLowerRef = useRef<ISeriesApi<"Line"> | null>(null)
    const bollingerUpperRef = useRef<ISeriesApi<"Line"> | null>(null)
    const bollingerMiddleRef = useRef<ISeriesApi<"Line"> | null>(null)
    const bollingerLowerRef = useRef<ISeriesApi<"Line"> | null>(null)

    useImperativeHandle(ref, () => ({
      scrollToRealTime: () => {
        if (chartRef.current) {
          chartRef.current.timeScale().scrollToRealTime()
        }
      },
      resetView: () => {
        if (chartRef.current) {
          chartRef.current.priceScale().applyOptions({ autoScale: true })
          chartRef.current.timeScale().scrollToRealTime()
          setTimeout(() => {
            chartRef.current?.priceScale().applyOptions({ autoScale: false })
          }, 50)
        }
      },
      fitContent: () => {
        if (chartRef.current) {
          chartRef.current.timeScale().fitContent()
        }
      },
      createPriceLine: (price: number, color: string, lineWidth: number, lineStyle: number, title: string) => {
        if (candlestickSeriesRef.current) {
          return candlestickSeriesRef.current.createPriceLine({
            price,
            color,
            lineWidth,
            lineStyle,
            axisLabelVisible: true,
            title,
          })
        }
        return null
      },
      removePriceLine: (line: any) => {
        if (candlestickSeriesRef.current && line) {
          try {
            candlestickSeriesRef.current.removePriceLine(line)
          } catch (e) {
            // Ignore
          }
        }
      },
      setVisibleLogicalRange: (range: LogicalRange) => {
        if (chartRef.current) {
          chartRef.current.timeScale().setVisibleLogicalRange(range)
        }
      },
    }))

    useEffect(() => {
      if (!chartContainerRef.current) return

      const chart = createChart(chartContainerRef.current, {
        layout: { background: { color: "#ffffff" }, textColor: "#333333" },
        grid: { vertLines: { color: "#e0e0e0" }, horzLines: { color: "#e0e0e0" } },
        width: chartContainerRef.current.clientWidth,
        height: 450,
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 50,
        },
        crosshair: { mode: 0 },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
        },
        handleScale: {
          axisPressedMouseMove: { time: false, price: false },
          axisDoubleClickReset: false,
          mouseWheel: true,
          pinch: false,
        },
        priceScale: {
          autoScale: false,
          mode: 0,
        },
      })

      chartRef.current = chart

      const candlestickSeries = chart.addCandlestickSeries({
        upColor: "#10b981",
        downColor: "#ef4444",
        borderUpColor: "#10b981",
        borderDownColor: "#ef4444",
        wickUpColor: "#10b981",
        wickDownColor: "#ef4444",
      })
      candlestickSeriesRef.current = candlestickSeries

      const sma5Series = chart.addLineSeries({
        color: "#ef4444",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      sma5SeriesRef.current = sma5Series

      const sma20Series = chart.addLineSeries({
        color: "#3b82f6",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      sma20SeriesRef.current = sma20Series

      const sma60Series = chart.addLineSeries({
        color: "#10b981",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      sma60SeriesRef.current = sma60Series

      const sma120Series = chart.addLineSeries({
        color: "#8b5cf6",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      sma120SeriesRef.current = sma120Series

      const donchianUpper = chart.addLineSeries({
        color: "rgba(107, 114, 128, 0.4)",
        lineWidth: 1,
        lineStyle: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      donchianUpperRef.current = donchianUpper

      const donchianLower = chart.addLineSeries({
        color: "rgba(107, 114, 128, 0.4)",
        lineWidth: 1,
        lineStyle: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      donchianLowerRef.current = donchianLower

      const bollingerUpperSeries = chart.addLineSeries({
        color: "rgba(147, 51, 234, 0.5)",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      bollingerUpperRef.current = bollingerUpperSeries

      const bollingerMiddleSeries = chart.addLineSeries({
        color: "rgba(147, 51, 234, 0.7)",
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      bollingerMiddleRef.current = bollingerMiddleSeries

      const bollingerLowerSeries = chart.addLineSeries({
        color: "rgba(147, 51, 234, 0.5)",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
      })
      bollingerLowerRef.current = bollingerLowerSeries

      chart.timeScale().subscribeVisibleLogicalRangeChange((logicalRange) => {
        if (logicalRange && logicalRange.from < 10 && onVisibleRangeChange) {
          const firstDataTime =
            data.length > 0 ? (typeof data[0].time === "number" ? data[0].time : data[0].time.valueOf()) : 0
          if (firstDataTime > 0) {
            onVisibleRangeChange(firstDataTime)
          }
        }
        if (onTimeRangeChange) {
          onTimeRangeChange(logicalRange)
        }
      })

      const handleResize = () => {
        if (chartContainerRef.current && chart) {
          chart.applyOptions({ width: chartContainerRef.current.clientWidth })
        }
      }

      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("resize", handleResize)
        chart.remove()
      }
    }, [onVisibleRangeChange, onTimeRangeChange])

    useEffect(() => {
      if (candlestickSeriesRef.current && data.length > 0) {
        const chartData: CandlestickData[] = data.map((d) => ({
          time: d.time as Time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }))
        candlestickSeriesRef.current.setData(chartData)
      }
    }, [data])

    useEffect(() => {
      if (sma5SeriesRef.current) {
        const lineData: LineData[] = sma5Data.map((d) => ({ time: d.time as Time, value: d.value }))
        sma5SeriesRef.current.setData(lineData)
        sma5SeriesRef.current.applyOptions({ visible: showSMA })
      }
    }, [sma5Data, showSMA])

    useEffect(() => {
      if (sma20SeriesRef.current) {
        const lineData: LineData[] = sma20Data.map((d) => ({ time: d.time as Time, value: d.value }))
        sma20SeriesRef.current.setData(lineData)
        sma20SeriesRef.current.applyOptions({ visible: showSMA })
      }
    }, [sma20Data, showSMA])

    useEffect(() => {
      if (sma60SeriesRef.current) {
        const lineData: LineData[] = sma60Data.map((d) => ({ time: d.time as Time, value: d.value }))
        sma60SeriesRef.current.setData(lineData)
        sma60SeriesRef.current.applyOptions({ visible: showSMA })
      }
    }, [sma60Data, showSMA])

    useEffect(() => {
      if (sma120SeriesRef.current) {
        const lineData: LineData[] = sma120Data.map((d) => ({ time: d.time as Time, value: d.value }))
        sma120SeriesRef.current.setData(lineData)
        sma120SeriesRef.current.applyOptions({ visible: showSMA })
      }
    }, [sma120Data, showSMA])

    useEffect(() => {
      if (donchianUpperRef.current) {
        const lineData: LineData[] = upperChannel.map((d) => ({ time: d.time as Time, value: d.value }))
        donchianUpperRef.current.setData(lineData)
        donchianUpperRef.current.applyOptions({ visible: showDonchian })
      }
    }, [upperChannel, showDonchian])

    useEffect(() => {
      if (donchianLowerRef.current) {
        const lineData: LineData[] = lowerChannel.map((d) => ({ time: d.time as Time, value: d.value }))
        donchianLowerRef.current.setData(lineData)
        donchianLowerRef.current.applyOptions({ visible: showDonchian })
      }
    }, [lowerChannel, showDonchian])

    useEffect(() => {
      if (bollingerUpperRef.current) {
        const lineData: LineData[] = bollingerUpper.map((d) => ({ time: d.time as Time, value: d.value }))
        bollingerUpperRef.current.setData(lineData)
        bollingerUpperRef.current.applyOptions({ visible: showBollinger })
      }
    }, [bollingerUpper, showBollinger])

    useEffect(() => {
      if (bollingerMiddleRef.current) {
        const lineData: LineData[] = bollingerMiddle.map((d) => ({ time: d.time as Time, value: d.value }))
        bollingerMiddleRef.current.setData(lineData)
        bollingerMiddleRef.current.applyOptions({ visible: showBollinger })
      }
    }, [bollingerMiddle, showBollinger])

    useEffect(() => {
      if (bollingerLowerRef.current) {
        const lineData: LineData[] = bollingerLower.map((d) => ({ time: d.time as Time, value: d.value }))
        bollingerLowerRef.current.setData(lineData)
        bollingerLowerRef.current.applyOptions({ visible: showBollinger })
      }
    }, [bollingerLower, showBollinger])

    useEffect(() => {
      if (candlestickSeriesRef.current && engulfingMarkers.length > 0) {
        const markers = engulfingMarkers.slice(-10).map((engulf) => ({
          time: engulf.candle.time as Time,
          position: engulf.type === "bullish" ? ("belowBar" as const) : ("aboveBar" as const),
          color: engulf.type === "bullish" ? "#10b981" : "#ef4444",
          shape: engulf.type === "bullish" ? ("arrowUp" as const) : ("arrowDown" as const),
          text: "E",
        }))
        candlestickSeriesRef.current.setMarkers(markers)
      }
    }, [engulfingMarkers])

    return <div ref={chartContainerRef} className="w-full h-[450px] bg-white rounded-lg shadow-md" />
  },
)

TradingChart.displayName = "TradingChart"
