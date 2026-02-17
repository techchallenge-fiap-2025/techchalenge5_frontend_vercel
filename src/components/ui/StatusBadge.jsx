export function StatusBadge({ status }) {
  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || "";
    
    // Status verdes
    if (["ativo", "formada", "criado", "formado"].includes(statusLower)) {
      return "text-green-600";
    }
    
    // Status amarelo/amarelo-esverdeado
    if (["em andamento", "em adamento"].includes(statusLower)) {
      return "text-yellow-600";
    }
    
    // Status vermelho
    if (["inativo", "descontinuada", "trancado", "reprovado"].includes(statusLower)) {
      return "text-red-600";
    }
    
    // Default
    return "text-gray-600";
  };

  return (
    <span
      className={`font-medium text-xs sm:text-sm ${getStatusColor(status)}`}
    >
      {status}
    </span>
  );
}
