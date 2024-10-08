/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  ColorType,
  type MouseEventParams,
  type Time,
  IChartApi,
} from 'lightweight-charts'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)

type Props = {
  data: {
    time: string
    value: number
    valuation: number
  }[]
  colors?: {
    backgroundColor?: string
    lineColor?: string
    textColor?: string
    areaTopColor?: string
    areaBottomColor?: string
  }
  lang: 'ru' | 'en'
}

const toolTipWidth = 100
const toolTipHeight = 60
const toolTipMargin = 8

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
  const [tooltip, setTooltip] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const mapRef = useRef(
    new Map<
      string,
      {
        valuation: number
      }
    >()
  )
  const [currentData, setCurrentData] = useState<{
    date: string
    price: number
    valuation: number
  }>({
    date: '',
    price: 0,
    valuation: 0,
  })
  const chartApi = useRef<IChartApi | null>(null)
  // const first = data[0] ?? {
  //   value: 0,
  //   valuation: 0,
  //   time: '',
  // }
  // const last = data[data.length - 1] ?? {
  //   value: 0,
  //   valuation: 0,
  //   time: '',
  // }
  const billionSuffix = props.lang === 'ru' ? ' млрд' : 'B'

  const chartContainerRef = useRef<HTMLDivElement>(null)
  const seriesApiRef = useRef<any | null>(null)

  useEffect(() => {
    const fitContent = () => {
      if (!chartContainerRef.current) return
      const chartWidth = chartContainerRef.current?.clientWidth

      if (!chartApi.current) return
      const barSpacing = chartApi.current.timeScale().options().barSpacing

      // Calculate how many points can fit in the chart
      const pointsThatFit = Math.floor(chartWidth / barSpacing)

      let groupedData = data

      if (pointsThatFit < data.length) {
        groupedData = groupDataByMonth(data)
      }

      seriesApiRef.current?.setData(groupedData)
      chartApi.current?.timeScale().fitContent()
    }

    window.addEventListener('chartOpened', fitContent)

    return () => {
      window.removeEventListener('chartOpened', fitContent)
    }
  }, [data])

  useEffect(() => {
    data.forEach((item: any) => {
      mapRef.current.set(item.time, {
        valuation: item.valuation,
      })
    })
  }, [data])

  useEffect(() => {
    const resize = () => {
      const ev = new CustomEvent('chartOpened')
      window.dispatchEvent(ev)
    }

    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
    }
  }, [])

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
        fontFamily: 'Mazzard, sans-serif',
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
        locale: props.lang === 'ru' ? 'ru-RU' : 'en-US',
        priceFormatter: (price: number) => {
          return price.toFixed(0)
        },
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
      handleScroll: false,
      handleScale: false,
    })

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

    const chartWidth = chartContainerRef.current.clientWidth

    // Get the current bar spacing (applies to area charts too)
    const barSpacing = chart.timeScale().options().barSpacing

    // Calculate how many points can fit in the chart
    const pointsThatFit = Math.floor(chartWidth / barSpacing)

    let groupedData = data

    if (pointsThatFit < data.length) {
      groupedData = groupDataByMonth(data)
    }
    newSeries.setData(groupedData)
    chart.timeScale().fitContent()

    seriesApiRef.current = newSeries

    window.addEventListener('resize', handleResize)

    const handleCrosshairMove = (param: MouseEventParams<Time>) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > (chartContainerRef.current?.clientWidth ?? 0) ||
        param.point.y < 0 ||
        param.point.y > (chartContainerRef.current?.clientHeight ?? 0)
      ) {
        setTooltip(false)
      } else {
        // time will be in the same format that we supplied to setData.
        // thus it will be YYYY-MM-DD
        if (!chartContainerRef.current) return
        const dateStr = param.time
        const data = param.seriesData.get(newSeries)
        if (data === undefined) {
          return
        }

        if ('value' in data) {
          setCurrentData({
            date: dayjs(dateStr as string).format('D MMM YYYY'),
            price: Math.round(data.value * 100) / 100,
            valuation: mapRef.current.get(dateStr as string)?.valuation ?? 0,
          })
        }

        const price = (data as any).value

        const coordinate = newSeries.priceToCoordinate(price)
        let shiftedCoordinate = param.point.x - 50
        if (coordinate === null) {
          return
        }
        shiftedCoordinate = Math.max(
          0,
          Math.min(
            chartContainerRef.current.clientWidth - toolTipWidth,
            shiftedCoordinate
          )
        )
        const coordinateY =
          coordinate - toolTipHeight - toolTipMargin > 0
            ? coordinate - toolTipHeight - toolTipMargin
            : Math.max(
                0,
                Math.min(
                  chartContainerRef.current.clientHeight -
                    toolTipHeight -
                    toolTipMargin,
                  coordinate + toolTipMargin
                )
              )
        setCoords({ x: shiftedCoordinate, y: coordinateY })
        setTooltip(true)
      }
    }

    chart.subscribeCrosshairMove(handleCrosshairMove)

    chartApi.current = chart

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.unsubscribeCrosshairMove(handleCrosshairMove)

      chart.remove()
    }
  }, [
    data,
    backgroundColor,
    lineColor,
    textColor,
    areaTopColor,
    areaBottomColor,
    props.lang,
  ])

  return (
    <>
      <div className="container">
        {/* <div className="chartInfo">
      <div className="chartInfoPrice">
        <p>${Math.round(last.value * 100) / 100}</p>
        <span
          style={{
            color: last.value - first.value > 0 ? '#00D1B2' : '#fc5454',
          }}
        >
          {Math.round((last.value - first.value) * 100) / 100}
        </span>
        <span
          style={{
            color: last.value - first.value > 0 ? '#00D1B2' : '#fc5454',
          }}
        >
          (
          {Math.round(((last.value - first.value) / first.value) * 10000) /
            100}
          %)
        </span>
      </div>
      <span className="chartInfoVolume">${last.valuation}</span>
    </div> */}
        <div className="chartContainer" ref={chartContainerRef} />

        {tooltip && (
          <div
            style={{
              left: coords.x,
              top: coords.y,
              width: toolTipWidth,
              height: toolTipHeight,
            }}
            className="tooltip"
          >
            <p>${currentData.price}</p>
            <p>
              ${currentData.valuation}
              {billionSuffix}
            </p>
            <span>{currentData.date}</span>
          </div>
        )}
      </div>
    </>
  )
}

function groupDataByMonth(data: Props['data']) {
  const grouped = data.reduce((acc, next) => {
    const month = dayjs(next.time).format('YYYY-MM')

    if (!acc[month]) {
      acc[month] = next
    }

    return acc
  }, {} as Record<string, Props['data'][number]>)

  return Object.values(grouped)
}
