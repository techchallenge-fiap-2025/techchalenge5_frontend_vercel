import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiBook, FiUsers, FiUser } from "react-icons/fi";
import { StatusBadge } from "../../components/ui/StatusBadge";
import turmaService from "../../services/turma.service";
import materiaService from "../../services/materia.service";
import { showErrorToast } from "../../components/feedback/toastConfig";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import { getInitials } from "../../utils/userUtils";
import { useAuth } from "../../context/AuthContext";

// Função para formatar período
const formatPeriodo = (periodo) => {
  const periodos = {
    manha: "Manhã",
    tarde: "Tarde",
    noite: "Noite",
    integral: "Integral",
  };
  return periodos[periodo] || periodo || "-";
};

// Função para formatar nível educacional
const formatNivelEducacional = (nivel) => {
  const niveis = {
    maternal: "Maternal",
    fundamental: "Fundamental",
    ensinoMedio: "Ensino Médio",
  };
  return niveis[nivel] || nivel || "-";
};

export function TurmaViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [turma, setTurma] = useState(null);
  const [materiasDoProfessor, setMateriasDoProfessor] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("alunos");

  const fetchTurma = async () => {
    setIsLoading(true);
    try {
      const result = await turmaService.getById(id);
      if (result.success) {
        setTurma(result.data);
        
        // Se for professor, buscar suas matérias para filtrar
        if (user?.role === "professor") {
          const materiasResult = await materiaService.getMinhasMaterias();
          if (materiasResult.success && materiasResult.data) {
            setMateriasDoProfessor(materiasResult.data || []);
          }
        }
      } else {
        showErrorToast(result.error || "Erro ao carregar dados da turma");
        navigate("/turmas");
      }
    } catch {
      showErrorToast("Erro ao carregar dados da turma");
      navigate("/turmas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTurma();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);
  
  // Filtrar matérias do professor (apenas as que ele leciona nesta turma)
  const materiasFiltradas = useMemo(() => {
    if (!turma || user?.role !== "professor") {
      return turma?.materias || [];
    }
    
    // Extrair IDs das matérias do professor
    const materiasIdsDoProfessor = materiasDoProfessor.map((m) => {
      if (typeof m === 'object' && m !== null) {
        return m._id?.toString() || m.toString();
      }
      return m?.toString();
    }).filter(Boolean);
    
    // Filtrar matérias da turma que o professor leciona
    return (turma.materias || []).filter((materia) => {
      const materiaId = typeof materia === 'object' && materia !== null
        ? materia._id?.toString() || materia.toString()
        : materia?.toString();
      return materiasIdsDoProfessor.includes(materiaId);
    });
  }, [turma, materiasDoProfessor, user]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!turma) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Turma não encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header com nome da turma e ano letivo */}
      <div className="bg-white border-b border-gray-200 -mx-4 sm:-mx-6 lg:-mx-12 xl:-mx-16 2xl:-mx-24">
        <div className="px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {turma.nome || "Nome não informado"} {turma.anoLetivo || ""}
          </h1>
        </div>
      </div>

      {/* Card principal com informações da turma */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Informações da turma */}
        <div className="space-y-4">
          {/* Nível Educacional */}
          <div className="flex items-center gap-3">
            <FiBook className="text-orange-500" size={20} />
            <div>
              <span className="text-sm text-gray-600">Nível Educacional:</span>
              <p className="text-orange-500 font-medium">{formatNivelEducacional(turma.nivelEducacional)}</p>
            </div>
          </div>

          {/* Período */}
          <div className="flex items-center gap-3">
            <FiUsers className="text-orange-500" size={20} />
            <div>
              <span className="text-sm text-gray-600">Período:</span>
              <p className="text-orange-500 font-medium">{formatPeriodo(turma.periodo)}</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <FiUser className="text-orange-500" size={20} />
            <div>
              <span className="text-sm text-gray-600">Status:</span>
              <p className="mt-1">
                <StatusBadge status={turma.status || "ativa"} />
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
            <button
              onClick={() => setActiveTab("materias")}
              className={`px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === "materias"
                  ? "text-orange-500 border-b-2 border-orange-500 cursor-pointer"
                  : "text-gray-600 hover:text-orange-500 cursor-pointer"
              }`}
            >
              Matérias
            </button>
            {/* Aba Professores apenas para admin */}
            {user?.role === "admin" && (
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
            )}
          </div>
        </div>

        {/* Conteúdo das abas */}
        <div className="p-3 sm:p-6">
          {activeTab === "alunos" && <AlunosTab alunos={turma.alunos || []} userRole={user?.role} />}
          {activeTab === "materias" && (
            <MateriasTab 
              materias={user?.role === "professor" ? materiasFiltradas : (turma.materias || [])}
              userRole={user?.role}
            />
          )}
          {user?.role === "admin" && activeTab === "professores" && (
            <ProfessoresTab professores={turma.professores || []} />
          )}
        </div>
      </div>
    </div>
  );
}

// Componente da aba Alunos
function AlunosTab({ alunos, userRole }) {
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
            userRole={userRole}
          />
        ))
      )}
    </div>
  );
}

// Componente de Card de Aluno
function AlunoCard({ aluno, userRole }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (userRole === "admin" && aluno._id) {
      navigate(`/alunos/${aluno._id}`);
    }
  };

  const user = aluno.userId || {};
  const nomeAluno = user.name || "Nome não informado";
  const fotoPerfil = user.fotoPerfil;
  const statusAluno = aluno.status || "ativo";

  return (
    <div
      onClick={handleCardClick}
      className={`bg-gray-100 border border-gray-200 rounded-xl overflow-hidden shadow-sm flex items-center gap-4 px-4 sm:px-6 py-3 sm:py-4 transition-shadow ${
        userRole === "admin" ? "cursor-pointer hover:shadow-md" : ""
      }`}
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
      </div>

      {/* Status */}
      <div className="shrink-0">
        <StatusBadge status={statusAluno} />
      </div>
    </div>
  );
}

// Componente da aba Matérias
function MateriasTab({ materias, userRole }) {
  return (
    <div className="space-y-4">
      {materias.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhuma matéria encontrada</p>
        </div>
      ) : (
        materias.map((materia) => (
          <MateriaCard
            key={materia._id}
            materia={materia}
            userRole={userRole}
          />
        ))
      )}
    </div>
  );
}

// Componente de Card de Matéria
function MateriaCard({ materia, userRole }) {
  const navigate = useNavigate();
  const nomeMateria = materia.nome || "Nome não informado";

  const handleCardClick = () => {
    if (userRole === "admin" && materia._id) {
      navigate(`/materias/${materia._id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-gray-100 border border-gray-200 rounded-xl overflow-hidden shadow-sm flex items-center gap-4 px-4 sm:px-6 py-3 sm:py-4 transition-shadow ${
        userRole === "admin" ? "cursor-pointer hover:shadow-md" : ""
      }`}
    >
      {/* Ícone de matéria */}
      <div className="shrink-0">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-orange-500 flex items-center justify-center">
          <FiBook className="text-white" size={24} />
        </div>
      </div>

      {/* Conteúdo central */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        {/* Nome da matéria */}
        <h3 className="text-lg sm:text-xl font-bold text-orange-500 mb-1 truncate">
          {nomeMateria}
        </h3>
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
