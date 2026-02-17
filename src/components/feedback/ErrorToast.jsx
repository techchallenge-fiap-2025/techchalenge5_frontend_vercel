import React from "react";

/**
 * Componente customizado para toast de erro
 * @param {string} message - Mensagem de erro
 */
export function ErrorToast({ message = "❌ Erro ao tentar fazer login" }) {
  return (
    <div className="flex flex-col bg-red-50 border-2 border-red-500 rounded-lg items-center gap-2 p-8">
      <div className="flex items-center gap-2">
        <span className="font-bold text-gray-dark text-base text-center">
          {message}
        </span>
      </div>
    </div>
  );
}
