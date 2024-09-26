/* eslint-disable @typescript-eslint/no-explicit-any */
import './fonts/style.css'
import { Chart } from './chart'
import { Filter, FilterType } from './filter'
import { useEffect, useMemo, useState } from 'react'
import ru from 'dayjs/locale/ru'
import en from 'dayjs/locale/en'
import dayjs from 'dayjs'

import mock from './data.json'

type DataItem = {
  date: string
  price_per_share: number
  valuation: number
}

function App() {
  const [filter, setFilter] = useState<FilterType>('6m')
  const [data, setData] = useState<DataItem[]>(mock)
  const [isAppReady, setIsAppReady] = useState(false)
  const [lang, setLang] = useState<'ru' | 'en'>('en')
  const handlerName = 'getChartData'

  const mappedData = useMemo(() => {
    const sortedData = sortDataByDate([...data])
    const filteredData = filterData(sortedData, filter)

    return filteredData.map((item) => ({
      time: item.date,
      value: item.price_per_share,
      valuation: item.valuation,
    }))
  }, [filter, data])

  useEffect(() => {
    const appReady = () => setIsAppReady(true)
    const langChanged = (ev: Event) => {
      setLang((ev as any).detail.lang)
    }

    window.addEventListener('flutterInAppWebViewPlatformReady', appReady)
    window.addEventListener('languageChanged', langChanged)

    return () => {
      window.removeEventListener('flutterInAppWebViewPlatformReady', appReady)
      window.removeEventListener('languageChanged', langChanged)
    }
  }, [])

  useEffect(() => {
    dayjs.locale(lang === 'ru' ? ru : en)
  }, [lang])

  useEffect(() => {
    function receive(incomingData: DataItem[]) {
      setData(incomingData)
    }

    ;(
      window as unknown as typeof window & { receive: typeof receive }
    ).receive = receive

    const flutterInAppWebView = (window as any)?.flutter_inappwebview

    if (flutterInAppWebView?.callHandler === undefined) return
    flutterInAppWebView
      ?.callHandler(handlerName)
      .then((result: { prices: DataItem[] }) => {
        receive(result.prices)
      })
  }, [isAppReady])

  return (
    <>
      <Chart key={filter} lang={lang} data={mappedData} />
      <Filter lang={lang} value={filter} onChange={(type) => setFilter(type)} />
    </>
  )
}

export default App

function sortDataByDate(data: DataItem[]) {
  return data.sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)

    return dateA.getTime() - dateB.getTime()
  })
}

function filterData(data: DataItem[], filter: FilterType) {
  const params: Record<FilterType, [number, dayjs.ManipulateType]> = {
    '3m': [3, 'month'],
    '6m': [6, 'month'],
    '1y': [1, 'year'],
    max: [0, 'year'],
  }

  if (data.length === 0) return data
  if (filter === 'max') return data

  const from = dayjs(data[data.length - 1].date).subtract(
    params[filter][0],
    params[filter][1]
  )

  return data.filter((item) => {
    const date = dayjs(item.date)

    return date.isAfter(from)
  })
}
