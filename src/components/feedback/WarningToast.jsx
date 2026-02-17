import React from "react";

/**
 * Componente customizado para toast de warning
 * @param {string} message - Mensagem de aviso
 */
export function WarningToast({ message = "⚠️ Algum campo está faltando" }) {
  return (
    <div className="flex flex-col items-center bg-yellow-50 border-2 border-yellow-500 rounded-lg gap-2 p-8">
      <div className="flex items-center gap-2">
        <span className="font-bold text-gray-dark text-base text-center">
          {message}
        </span>
      </div>
    </div>
  );
}
