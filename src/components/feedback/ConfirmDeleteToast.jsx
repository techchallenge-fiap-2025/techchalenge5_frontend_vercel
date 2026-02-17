import React from "react";

/**
 * Componente customizado para toast de confirmação de deleção
 */
export function ConfirmDeleteToast({ message, onConfirm, onCancel }) {
  return (
    <div className="flex flex-col items-center bg-blue-50 border-2 border-blue-500 rounded-lg gap-4 p-8">
      <div className="flex items-center gap-2">
        <span className="font-bold text-gray-dark text-base text-center">
          {message}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onConfirm}
          className="bg-green-500 hover:bg-green-600 text-white font-medium px-6 py-2 rounded-lg transition-colors"
        >
          Sim
        </button>
        <button
          onClick={onCancel}
          className="bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-2 rounded-lg transition-colors"
        >
          Não
        </button>
      </div>
    </div>
  );
}
