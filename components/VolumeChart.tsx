"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type HistogramData,
  type Time,
  type LogicalRange,
} from "lightweight-charts"
import type { VolumeData } from "@/types/trading"

interface VolumeChartProps {
  data: VolumeData[]
  onTimeRangeChange?: (range: LogicalRange | null) => void
}

export interface VolumeChartHandle {
  setVisibleLogicalRange: (range: LogicalRange) => void
  fitContent: () => void
}

export const VolumeChart = forwardRef<VolumeChartHandle, VolumeChartProps>(({ data, onTimeRangeChange }, ref) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null)

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

    const volumeSeries = chart.addHistogramSeries({
      color: "rgba(0, 150, 136, 0.5)",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    })
    volumeSeriesRef.current = volumeSeries

    chart.priceScale("").applyOptions({ scaleMargins: { top: 0.9, bottom: 0 } })

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
    if (volumeSeriesRef.current && data.length > 0) {
      const histogramData: HistogramData[] = data.map((d) => ({
        time: d.time as Time,
        value: d.value,
        color: d.color,
      }))
      volumeSeriesRef.current.setData(histogramData)
    }
  }, [data])

  return <div ref={chartContainerRef} className="w-full h-[100px] bg-white rounded-lg shadow-md" />
})

VolumeChart.displayName = "VolumeChart"
