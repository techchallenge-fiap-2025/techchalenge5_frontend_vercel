import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiBook, FiUser } from "react-icons/fi";
import { StatusBadge } from "../../components/ui/StatusBadge";
import materiaService from "../../services/materia.service";
import { showErrorToast } from "../../components/feedback/toastConfig";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import { getInitials } from "../../utils/userUtils";

export function MateriaViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [materia, setMateria] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("professores");

  const fetchMateria = async () => {
    setIsLoading(true);
    try {
      const result = await materiaService.getById(id);
      if (result.success) {
        setMateria(result.data);
      } else {
        showErrorToast(result.error || "Erro ao carregar dados da matéria");
        navigate("/materias");
      }
    } catch {
      showErrorToast("Erro ao carregar dados da matéria");
      navigate("/materias");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchMateria();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!materia) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Matéria não encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header com nome da matéria */}
      <div className="bg-white border-b border-gray-200 -mx-4 sm:-mx-6 lg:-mx-12 xl:-mx-16 2xl:-mx-24">
        <div className="px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {materia.nome || "Nome não informado"}
          </h1>
        </div>
      </div>

      {/* Card principal com informações da matéria */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Informações da matéria */}
        <div className="space-y-4">
          {/* Descrição */}
          {materia.descricao && (
            <div className="flex items-start gap-3">
              <FiBook className="text-orange-500" size={20} />
              <div className="flex-1">
                <span className="text-sm text-gray-600">Descrição:</span>
                <p className="text-orange-500 font-medium mt-1">{materia.descricao}</p>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center gap-3">
            <FiUser className="text-orange-500" size={20} />
            <div>
              <span className="text-sm text-gray-600">Status:</span>
              <p className="mt-1">
                <StatusBadge status={materia.status || "ativa"} />
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
              onClick={() => setActiveTab("professores")}
              className={`px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === "professores"
                  ? "text-orange-500 border-b-2 border-orange-500 cursor-pointer"
                  : "text-gray-600 hover:text-orange-500 cursor-pointer"
              }`}
            >
              Professores
            </button>
          </div>
        </div>

        {/* Conteúdo das abas */}
        <div className="p-3 sm:p-6">
          {activeTab === "professores" && <ProfessoresTab professores={materia.professores || []} />}
        </div>
      </div>
    </div>
  );
}

// Componente da aba Professores
function ProfessoresTab({ professores }) {
  return (
    <div className="space-y-4">
      {professores.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhum professor encontrado</p>
        </div>
      ) : (
        professores.map((professor) => (
          <ProfessorCard
            key={professor._id}
            professor={professor}
          />
        ))
      )}
    </div>
  );
}

// Componente de Card de Professor
function ProfessorCard({ professor }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (professor._id) {
      navigate(`/professores/${professor._id}`);
    }
  };

  const user = professor.userId || {};
  const nomeProfessor = user.name || "Nome não informado";
  const fotoPerfil = user.fotoPerfil;
  const statusProfessor = professor.status || "ativo";

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
            alt={nomeProfessor}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-orange-500 flex items-center justify-center">
            <span className="text-white font-bold text-xl sm:text-2xl">
              {getInitials(nomeProfessor)}
            </span>
          </div>
        )}
      </div>

      {/* Conteúdo central */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        {/* Nome do professor */}
        <h3 className="text-lg sm:text-xl font-bold text-orange-500 mb-1 truncate">
          {nomeProfessor}
        </h3>
      </div>

      {/* Status */}
      <div className="shrink-0">
        <StatusBadge status={statusProfessor} />
      </div>
    </div>
  );
}
