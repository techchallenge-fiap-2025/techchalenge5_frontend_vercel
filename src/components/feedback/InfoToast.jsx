import React from "react";

/**
 * Componente customizado para toast de informação
 */
export function InfoToast({ message }) {
  return (
    <div className="flex flex-col items-center bg-blue-50 border-2 border-blue-500 rounded-lg gap-2 p-8">
      <div className="flex items-center gap-2">
        <span className="font-bold text-gray-dark text-base text-center">
          {message}
        </span>
      </div>
    </div>
  );
}
