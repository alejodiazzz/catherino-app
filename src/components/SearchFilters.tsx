import React from 'react'

export interface FilterField {
  id: string
  label: string
  type: 'text' | 'select'
  placeholder?: string
  options?: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}

interface SearchFiltersProps {
  fields: FilterField[]
  onSearch: () => void
  onAdd?: () => void
  addButtonText?: string
  searchButtonText?: string
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  fields,
  onSearch,
  onAdd,
  addButtonText = 'Agregar',
  searchButtonText = 'Buscar',
}) => {
  return (
    <section className="bg-white rounded-lg p-[25px] shadow-[0_4px_12px_rgba(0,0,0,0.05)] mb-[30px]">
      <div className="flex flex-wrap gap-[15px] mb-5">
        {fields.map((field) => (
          <div key={field.id} className="flex-1 min-w-[200px]">
            <label className="block mb-2 font-semibold text-sm text-[#333]">{field.label}</label>
            {field.type === 'text' ? (
              <input
                type="text"
                id={field.id}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="w-full py-3 px-[15px] bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#0074D9]"
                placeholder={field.placeholder}
              />
            ) : (
              <select
                id={field.id}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="w-full py-3 px-[15px] bg-[#f5f5f5] border border-[#dcdcdc] rounded-md text-sm transition-colors focus:outline-none focus:border-[#0074D9]"
              >
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center max-md:flex-col max-md:gap-4">
        <button
          onClick={onSearch}
          className="bg-[#0074D9] text-white border-none py-3 px-[25px] rounded-md font-semibold cursor-pointer transition-colors flex items-center hover:bg-[#0056a3] max-md:w-full max-md:justify-center"
        >
          <i className="fas fa-search mr-2"></i> {searchButtonText}
        </button>
        {onAdd && (
          <button
            onClick={onAdd}
            className="bg-[#3d9970] text-white border-none py-3 px-[25px] rounded-md font-semibold cursor-pointer transition-colors flex items-center hover:bg-[#2e8b57] max-md:w-full max-md:justify-center"
          >
            <i className="fas fa-plus mr-2"></i> {addButtonText}
          </button>
        )}
      </div>
    </section>
  )
}

export default SearchFilters
