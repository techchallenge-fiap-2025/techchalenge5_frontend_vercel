/**
 * Gera as iniciais do nome do usuário
 * @param {string} name - Nome completo do usuário
 * @returns {string} - Iniciais (ex: "Lucas Piran" -> "LP", "Admin" -> "A")
 */
export function getInitials(name) {
  if (!name || typeof name !== "string") {
    return "U"; // Default para usuário sem nome
  }

  const nameParts = name.trim().split(/\s+/);
  
  if (nameParts.length === 1) {
    // Se tiver apenas um nome, retorna a primeira letra
    return nameParts[0].charAt(0).toUpperCase();
  }
  
  // Se tiver mais de um nome, retorna primeira letra do primeiro e último nome
  const firstInitial = nameParts[0].charAt(0).toUpperCase();
  const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
  
  return `${firstInitial}${lastInitial}`;
}
