import { FiEdit2, FiTrash2 } from "react-icons/fi";

export function ActionButtons({ onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {onEdit && (
        <button
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
          aria-label="Editar"
        >
          <FiEdit2 size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-700 transition-colors cursor-pointer"
          aria-label="Deletar"
        >
          <FiTrash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
        </button>
      )}
    </div>
  );
}
