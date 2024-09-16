import { useEffect, useRef } from 'react'
import { createChart, ColorType } from 'lightweight-charts'

type Props = {
  data: any[]
  colors?: {
    backgroundColor?: string
    lineColor?: string
    textColor?: string
    areaTopColor?: string
    areaBottomColor?: string
  }
}

export const Chart = (props: Props) => {
  const {
    data,
    colors: {
      backgroundColor = '#151517',
      lineColor = '#F9FF80',
      textColor = '#AAAAB2',
      areaTopColor = 'rgba(249, 255, 128, 0.50)',
      areaBottomColor = 'rgba(249, 255, 128, 0.005)',
    } = {},
  } = props

  const chartContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth })
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
        attributionLogo: false,
      },
      width: chartContainerRef.current?.clientWidth,
      height: 420,
      watermark: {
        visible: false,
      },
      grid: {
        horzLines: {
          visible: false,
        },
        vertLines: {
          visible: false,
        },
      },
      localization: {
        locale: 'ru-RU',
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.15)',
        ticksVisible: true,
        barSpacing: 4,
        minBarSpacing: 4,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.15)',
        ticksVisible: true,
      },
      crosshair: {
        horzLine: {
          labelBackgroundColor: 'rgba(36, 36, 38, 1)',
        },
      },
    })
    chart.timeScale().fitContent()

    const newSeries = chart.addAreaSeries({
      lineColor,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerBorderWidth: 4,
      crosshairMarkerBackgroundColor: 'rgba(255, 255, 255, 1)',
      crosshairMarkerBorderColor: 'rgba(255, 255, 255, 0.1)',
    })
    newSeries.setData(data)

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)

      chart.remove()
    }
  }, [
    data,
    backgroundColor,
    lineColor,
    textColor,
    areaTopColor,
    areaBottomColor,
  ])

  return (
    <div className="container">
      <div className="chartInfo">
        <div className="chartInfoPrice">
          <p>$405.84</p>
          <span>-110</span>
          <span>(-21.3%)</span>
        </div>
        <span className="chartInfoVolume">$21.9 млрд</span>
      </div>
      <div className="chartContainer" ref={chartContainerRef} />
    </div>
  )
}
