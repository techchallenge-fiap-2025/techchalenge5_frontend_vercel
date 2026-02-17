import { FiSearch, FiFilter } from "react-icons/fi";

export function SearchBar({ placeholder = "Buscar ...", onSearch, onFilter }) {
  return (
    <div className="flex flex-row items-center justify-end gap-2 sm:gap-3 w-full">
      {/* Campo de busca */}
      <div className="relative w-[90%] sm:w-64 bg-white rounded-lg">
        <input
          type="text"
          placeholder={placeholder}
          onChange={(e) => onSearch?.(e.target.value)}
          className="w-full px-4 py-2 pr-10 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-dark text-sm sm:text-base"
        />
        <FiSearch
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-500 transition-colors cursor-pointer"
          size={18}
        />
      </div>
      {/* Botão de filtro */}
      <button
        onClick={onFilter}
        className="w-[10%] sm:w-auto p-2 border bg-white border-gray-600 rounded-lg hover:text-orange-500 transition cursor-pointer shrink-0 flex items-center justify-center"
      >
        <FiFilter size={20} />
      </button>
    </div>
  );
}
