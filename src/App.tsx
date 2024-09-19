import './fonts/style.css'
import { Chart } from './chart'
import data from './data.json'
import { Filter, FilterType } from './filter'
import { useMemo, useState } from 'react'
import ru from 'dayjs/locale/ru'
import dayjs from 'dayjs'

dayjs.locale(ru)

function App() {
  const [filter, setFilter] = useState<FilterType>('3m')

  const mappedData = useMemo(() => {
    return data
  }, [filter])
  return (
    <>
      <Chart key={filter} data={mappedData} />
      <Filter value={filter} onChange={(type) => setFilter(type)} />
    </>
  )
}

export default App
