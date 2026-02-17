import { FiChevronDown } from "react-icons/fi";

export function ExpandButton({ isExpanded, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-all duration-300 ease-in-out"
      aria-label={isExpanded ? "Colapsar" : "Expandir"}
    >
      <FiChevronDown 
        className={`text-gray-700 transition-transform duration-300 ease-in-out ${
          isExpanded ? "rotate-180" : "rotate-0"
        }`}
        size={16}
      />
    </button>
  );
}
