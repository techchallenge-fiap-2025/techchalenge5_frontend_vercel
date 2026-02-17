import { UserAvatar } from "./UserAvatar";
import { StatusBadge } from "./StatusBadge";

export function AlunoCard({ aluno }) {
  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-white rounded-lg border border-gray-200">
      {/* ID do Aluno */}
      <span className="text-xs sm:text-sm font-medium text-gray-700 w-16 sm:w-20 shrink-0">
        {aluno.id}
      </span>
      {/* Imagem, Nome e Email */}
      <div className="flex-1 min-w-0">
        <UserAvatar
          fotoPerfil={aluno.fotoPerfil}
          nome={aluno.nome}
          email={aluno.email}
        />
      </div>
      {/* Status do Aluno */}
      <StatusBadge status={aluno.status} />
    </div>
  );
}
