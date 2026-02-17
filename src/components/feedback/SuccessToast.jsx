import React from "react";

/**
 * Componente customizado para toast de sucesso
 */
export function SuccessToast({ message = "✅ Logado com sucesso" }) {
  return (
    <div className="flex flex-col items-center bg-green-50 border-2 border-green-500 rounded-lg gap-2 p-8">
      <div className="flex items-center gap-2">
        <span className="font-bold text-gray-dark text-base">
          {message}
        </span>
      </div>
    </div>
  );
}
