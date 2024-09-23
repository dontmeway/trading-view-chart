export type FilterType = '3m' | '6m' | '1y' | 'max'

type Props = {
  value: FilterType
  onChange: (value: FilterType) => void
  lang: 'ru' | 'en'
}

const langs: Record<'ru' | 'en', Record<FilterType, string>> = {
  en: {
    '1y': '1Y',
    '3m': '3M',
    '6m': '6M',
    max: 'Max',
  },
  ru: {
    '1y': '1Г',
    '3m': '3М',
    '6m': '6М',
    max: 'Макс',
  },
}

const filters: FilterType[] = ['3m', '6m', '1y', 'max']

export const Filter = (props: Props) => {
  return (
    <div className="filter">
      {filters.map((filter) => (
        <button
          key={filter}
          className={(props.value === filter ? 'active ' : '') + 'filterButton'}
          onClick={() => props.onChange(filter)}
        >
          {langs[props.lang][filter]}
        </button>
      ))}
    </div>
  )
}
