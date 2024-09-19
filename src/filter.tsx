export type FilterType = '3m' | '6m' | '1y' | 'max'

type Props = {
  value: FilterType
  onChange: (value: FilterType) => void
}

const filters: {
  value: FilterType
  label: string
}[] = [
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: 'max', label: 'Max' },
]

export const Filter = (props: Props) => {
  return (
    <div className="filter">
      {filters.map((filter) => (
        <button
          key={filter.value}
          className={
            (props.value === filter.value ? 'active ' : '') + 'filterButton'
          }
          onClick={() => props.onChange(filter.value)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
