import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiLock, FiUnlock, FiMail, FiUser, FiPhone } from "react-icons/fi";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import responsavelService from "../../services/responsavel.service";
import { showErrorToast, showSuccessToast } from "../../components/feedback/toastConfig";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import { getInitials } from "../../utils/userUtils";

// Função para formatar CPF
const formatCPF = (cpf) => {
  if (!cpf) return "-";
  const cpfClean = cpf.replace(/\D/g, "");
  return cpfClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

// Função para formatar telefone
const formatTelefone = (telefone) => {
  if (!telefone) return "-";
  const telefoneClean = telefone.replace(/\D/g, "");
  if (telefoneClean.length === 10) {
    return telefoneClean.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  } else if (telefoneClean.length === 11) {
    return telefoneClean.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return telefone;
};

export function ResponsavelViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [responsavel, setResponsavel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [activeTab, setActiveTab] = useState("alunos");

  const fetchResponsavel = async () => {
    setIsLoading(true);
    try {
      const result = await responsavelService.getById(id);
      if (result.success) {
        setResponsavel(result.data);
      } else {
        showErrorToast(result.error || "Erro ao carregar dados do responsável");
        navigate("/responsaveis");
      }
    } catch {
      showErrorToast("Erro ao carregar dados do responsável");
      navigate("/responsaveis");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchResponsavel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleToggleActive = async () => {
    if (isToggling) return;

    setIsToggling(true);
    try {
      const result = await responsavelService.toggleActive(id);
      if (result.success) {
        // Atualizar o estado local com os dados atualizados
        setResponsavel(result.data.responsavel);
        const isActive = result.data.responsavel.active;
        showSuccessToast(
          isActive
            ? "✅ Responsável ativado com sucesso"
            : "✅ Responsável desativado com sucesso"
        );
      } else {
        showErrorToast(result.error || "Erro ao atualizar status do responsável");
      }
    } catch {
      showErrorToast("Erro ao atualizar status do responsável");
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!responsavel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Responsável não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header com nome e ícone de cadeado */}
      <div className="bg-white border-b border-gray-200 -mx-4 sm:-mx-6 lg:-mx-12 xl:-mx-16 2xl:-mx-24">
        <div className="px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-4">
          <div className="flex flex-row items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              {responsavel.nome || "Nome não informado"}
            </h1>
            <button
              onClick={handleToggleActive}
              disabled={isToggling}
              className="flex items-center gap-2 transition-opacity hover:opacity-80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title={responsavel.active === false ? "Clique para ativar" : "Clique para desativar"}
            >
              {responsavel.active === false ? (
                <FiLock className="text-red-500" size={24} />
              ) : (
                <FiUnlock className="text-green-500" size={24} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Card principal com informações do responsável */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Informações pessoais */}
        <div className="space-y-4">
          {/* Email */}
          <div className="flex items-center gap-3">
            <FiMail className="text-orange-500" size={20} />
            <div>
              <span className="text-sm text-gray-600">Email:</span>
              <p className="text-orange-500 font-medium">{responsavel.email || "-"}</p>
            </div>
          </div>

          {/* CPF */}
          <div className="flex items-center gap-3">
            <FiUser className="text-orange-500" size={20} />
            <div>
              <span className="text-sm text-gray-600">CPF:</span>
              <p className="text-orange-500 font-medium">{formatCPF(responsavel.cpf)}</p>
            </div>
          </div>

          {/* Telefone */}
          <div className="flex items-center gap-3">
            <FiPhone className="text-orange-500" size={20} />
            <div>
              <span className="text-sm text-gray-600">Telefone:</span>
              <p className="text-orange-500 font-medium">{formatTelefone(responsavel.telefone)}</p>
            </div>
          </div>

          {/* Parentesco */}
          <div className="flex items-center gap-3">
            <FiUser className="text-orange-500" size={20} />
            <div>
              <span className="text-sm text-gray-600">Parentesco:</span>
              <p className="text-orange-500 font-medium capitalize">{responsavel.parentesco || "-"}</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <FiUser className="text-orange-500" size={20} />
            <div>
              <span className="text-sm text-gray-600">Status:</span>
              <p className="mt-1">
                <StatusBadge status={responsavel.active ? "ativo" : "inativo"} />
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação com abas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex min-w-max">
            <button
              onClick={() => setActiveTab("alunos")}
              className={`px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === "alunos"
                  ? "text-orange-500 border-b-2 border-orange-500 cursor-pointer"
                  : "text-gray-600 hover:text-orange-500 cursor-pointer"
              }`}
            >
              Alunos
            </button>
          </div>
        </div>

        {/* Conteúdo das abas */}
        <div className="p-3 sm:p-6">
          {activeTab === "alunos" && <AlunosTab alunos={responsavel.alunos || []} />}
        </div>
      </div>
    </div>
  );
}

// Componente da aba Alunos
function AlunosTab({ alunos }) {
  return (
    <div className="space-y-4">
      {alunos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhum aluno encontrado</p>
        </div>
      ) : (
        alunos.map((aluno) => (
          <AlunoCard
            key={aluno._id}
            aluno={aluno}
          />
        ))
      )}
    </div>
  );
}

// Componente de Card de Aluno
function AlunoCard({ aluno }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (aluno._id) {
      navigate(`/alunos/${aluno._id}`);
    }
  };

  const user = aluno.userId || {};
  const turma = aluno.turmaId || {};
  const nomeAluno = user.name || "Nome não informado";
  const fotoPerfil = user.fotoPerfil;
  const nomeTurma = turma.nome || "Sem turma";
  const statusAluno = aluno.status || "ativo";

  return (
    <div
      onClick={handleCardClick}
      className="bg-gray-100 border border-gray-200 rounded-xl overflow-hidden shadow-sm flex items-center gap-4 px-4 sm:px-6 py-3 sm:py-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Foto de perfil circular ou Iniciais */}
      <div className="shrink-0">
        {fotoPerfil?.url ? (
          <img
            src={fotoPerfil.url}
            alt={nomeAluno}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-orange-500 flex items-center justify-center">
            <span className="text-white font-bold text-xl sm:text-2xl">
              {getInitials(nomeAluno)}
            </span>
          </div>
        )}
      </div>

      {/* Conteúdo central */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        {/* Nome do aluno */}
        <h3 className="text-lg sm:text-xl font-bold text-orange-500 mb-1 truncate">
          {nomeAluno}
        </h3>

        {/* Turma */}
        <p className="text-gray-600 text-sm sm:text-base">
          {nomeTurma}
        </p>
      </div>

      {/* Status */}
      <div className="shrink-0">
        <StatusBadge status={statusAluno} />
      </div>
    </div>
  );
}
