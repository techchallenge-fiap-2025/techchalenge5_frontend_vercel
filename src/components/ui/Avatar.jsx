import { getInitials } from "../../utils/userUtils";

/**
 * Componente de avatar circular do usuário
 * Mostra foto de perfil se disponível, caso contrário mostra as iniciais
 */
export function Avatar({ 
  fotoPerfil, 
  name, 
  size = "md",
  className = "" 
}) {
  const initials = getInitials(name);
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-10 h-10 text-base",
    xl: "w-12 h-12 text-lg",
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`${sizeClass} rounded-full bg-orange-500 flex items-center justify-center font-semibold text-white shrink-0 overflow-hidden ${className}`}>
      {fotoPerfil?.url ? (
        <img
          src={fotoPerfil.url}
          alt={name || "Usuário"}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
