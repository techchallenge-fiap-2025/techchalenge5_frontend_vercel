import { Avatar } from "./Avatar";
import { getInitials } from "../../utils/userUtils";

/**
 * Componente de avatar do usuário com nome e email
 * Usado nas tabelas (Alunos, Professores, etc)
 */
export function UserAvatar({ avatar, nome, email, fotoPerfil }) {
  // Se não tiver avatar explícito, usar fotoPerfil ou gerar iniciais
  const displayAvatar = avatar || (fotoPerfil?.url ? null : getInitials(nome || ""));
  
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {fotoPerfil?.url ? (
        <Avatar fotoPerfil={fotoPerfil} name={nome} size="md" />
      ) : (
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-500 flex items-center justify-center font-semibold text-xs sm:text-sm text-white shrink-0">
          {displayAvatar}
        </div>
      )}
      <div className="flex flex-col min-w-0">
        <span className="font-bold text-gray-dark text-xs sm:text-sm truncate">
          {nome}
        </span>
        {email && (
          <span className="text-xs sm:text-sm text-gray-600 truncate">
            {email}
          </span>
        )}
      </div>
    </div>
  );
}
