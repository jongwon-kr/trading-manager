"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
  type LogicalRange,
} from "lightweight-charts"
import type { IndicatorData } from "@/types/trading"

interface RSIChartProps {
  data: IndicatorData[]
  onTimeRangeChange?: (range: LogicalRange | null) => void
}

export interface RSIChartHandle {
  setVisibleLogicalRange: (range: LogicalRange) => void
  fitContent: () => void
}

export const RSIChart = forwardRef<RSIChartHandle, RSIChartProps>(({ data, onTimeRangeChange }, ref) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)

  useImperativeHandle(ref, () => ({
    setVisibleLogicalRange: (range: LogicalRange) => {
      if (chartRef.current) {
        chartRef.current.timeScale().setVisibleLogicalRange(range)
      }
    },
    fitContent: () => {
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent()
      }
    },
  }))

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { color: "#ffffff" }, textColor: "#333333" },
      grid: { vertLines: { color: "#f0f0f0" }, horzLines: { color: "#f0f0f0" } },
      width: chartContainerRef.current.clientWidth,
      height: 100,
      timeScale: { timeVisible: true, secondsVisible: false, visible: false },
      crosshair: { mode: 0 },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
      handleScale: {
        axisPressedMouseMove: { time: false, price: false },
        axisDoubleClickReset: false,
        mouseWheel: true,
        pinch: false,
      },
    })

    chartRef.current = chart

    const rsiSeries = chart.addLineSeries({ color: "#c792ea", lineWidth: 2 })
    rsiSeriesRef.current = rsiSeries

    rsiSeries.createPriceLine({
      price: 70,
      color: "#ef4444",
      lineWidth: 1,
      lineStyle: 1,
      axisLabelVisible: true,
      title: "70",
    })

    rsiSeries.createPriceLine({
      price: 30,
      color: "#10b981",
      lineWidth: 1,
      lineStyle: 1,
      axisLabelVisible: true,
      title: "30",
    })

    chart.priceScale().applyOptions({
      autoScale: false,
      scaleMargins: { top: 0.1, bottom: 0.1 },
    })

    chart.timeScale().subscribeVisibleLogicalRangeChange((logicalRange) => {
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
  }, [onTimeRangeChange])

  useEffect(() => {
    if (rsiSeriesRef.current && data.length > 0) {
      const lineData: LineData[] = data.map((d) => ({ time: d.time as Time, value: d.value }))
      rsiSeriesRef.current.setData(lineData)
    }
  }, [data])

  return <div ref={chartContainerRef} className="w-full h-[100px] bg-white rounded-lg shadow-md" />
})

RSIChart.displayName = "RSIChart"
