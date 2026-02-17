import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiLock, FiUnlock, FiMail, FiUser, FiMapPin, FiCalendar, FiHome, FiBookOpen } from "react-icons/fi";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import professorService from "../../services/professor.service";
import { showErrorToast, showSuccessToast } from "../../components/feedback/toastConfig";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import { getInitials } from "../../utils/userUtils";
import computadores from "../../assets/computadores.png";

// Função para formatar CPF
const formatCPF = (cpf) => {
  if (!cpf) return "-";
  const cpfClean = cpf.replace(/\D/g, "");
  return cpfClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

// Função para formatar data
const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

export function ProfessorViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [professor, setProfessor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [activeTab, setActiveTab] = useState("turmas");

  const fetchProfessor = async () => {
    setIsLoading(true);
    try {
      const result = await professorService.getById(id);
      if (result.success) {
        setProfessor(result.data);
      } else {
        showErrorToast(result.error || "Erro ao carregar dados do professor");
        navigate("/professores");
      }
      } catch {
        showErrorToast("Erro ao carregar dados do professor");
        navigate("/professores");
      } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProfessor();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleToggleActive = async () => {
    if (isToggling) return;

    setIsToggling(true);
    try {
      const result = await professorService.toggleActive(id);
      if (result.success) {
        // Atualizar o estado local com os dados atualizados
        setProfessor(result.data.professor);
        const isActive = result.data.professor.userId?.active;
        showSuccessToast(
          isActive
            ? "✅ Usuário ativado com sucesso"
            : "✅ Usuário bloqueado com sucesso"
        );
      } else {
        showErrorToast(result.error || "Erro ao atualizar status do usuário");
      }
      } catch {
        showErrorToast("Erro ao atualizar status do usuário");
      } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!professor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Professor não encontrado</p>
      </div>
    );
  }

  const user = professor.userId || {};
  const endereco = user.endereco || {};

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header com nome e ícone de cadeado */}
      <div className="bg-white border-b border-gray-200 -mx-4 sm:-mx-6 lg:-mx-12 xl:-mx-16 2xl:-mx-24">
      <div className="px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-4">
        <div className="flex flex-row items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          {user.name || "Nome não informado"}
        </h1>
        <button
          onClick={handleToggleActive}
          disabled={isToggling}
          className="flex items-center gap-2 transition-opacity hover:opacity-80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title={user.active === false ? "Clique para ativar" : "Clique para bloquear"}
        >
          {user.active === false ? (
            <FiLock className="text-red-500" size={24} />
          ) : (
            <FiUnlock className="text-green-500" size={24} />
          )}
        </button>
        </div>
      </div>
    </div>

      {/* Card principal com informações do professor */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Foto de perfil ou Iniciais */}
        <div className="flex justify-center">
          <div className="relative">
            {user.fotoPerfil?.url ? (
              <img
                src={user.fotoPerfil.url}
                alt={user.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-orange-500"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-orange-500 flex items-center justify-center border-4 border-orange-500">
                <span className="text-white font-bold text-4xl">
                  {getInitials(user.name || "Nome não informado")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Informações pessoais */}
        <div className="space-y-4">
          {/* Email */}
          <div className="flex items-center gap-3">
            <FiMail className="text-orange-500" size={20} />
            <div>
              <span className="text-sm text-gray-600">Email:</span>
              <p className="text-orange-500 font-medium">{user.email || "-"}</p>
            </div>
          </div>

          {/* CPF */}
          <div className="flex items-center gap-3">
            <FiUser className="text-orange-500" size={20} />
            <div>
              <span className="text-sm text-gray-600">CPF:</span>
              <p className="text-orange-500 font-medium">{formatCPF(user.cpf)}</p>
            </div>
          </div>

          {/* Idade */}
          <div className="flex items-center gap-3">
            <FiUser className="text-orange-500" size={20} />
            <div>
              <span className="text-sm text-gray-600">Idade:</span>
              <p className="text-orange-500 font-medium">{user.idade || "-"}</p>
            </div>
          </div>

          {/* Última vez logado */}
          <div className="flex items-center gap-3">
            <FiCalendar className="text-orange-500" size={20} />
            <div>
              <span className="text-sm text-gray-600">Última Vez Logado:</span>
              <p className="text-orange-500 font-medium">
                {formatDate(user.lastLoginAt) || "-"}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <FiUser className="text-orange-500" size={20} />
            <div>
              <span className="text-sm text-gray-600">Status:</span>
              <p className="mt-1">
                <StatusBadge status={professor.status || "ativo"} />
              </p>
            </div>
          </div>
        </div>

        {/* Matérias */}
        {professor.materias && professor.materias.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FiBookOpen className="text-orange-500" />
              Matérias
            </h3>
            <div className="border-2 border-orange-500 rounded-lg p-4">
              <div className="flex flex-wrap gap-2">
                {professor.materias.map((materia, index) => (
                  <span
                    key={materia._id || index}
                    className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
                  >
                    {materia.nome || "Sem nome"}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Endereço */}
        {(endereco.cep || endereco.rua || endereco.numero || endereco.bairro || endereco.cidade || endereco.estado) && (
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FiMapPin className="text-orange-500" />
              Endereço
            </h3>
            <div className="border-2 border-orange-500 rounded-lg p-4 space-y-2">
              {endereco.cep && (
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-gray-700 min-w-[60px]">CEP:</span>
                  <span className="text-orange-500">{endereco.cep}</span>
                </div>
              )}
              {endereco.rua && (
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-gray-700 min-w-[60px]">Rua:</span>
                  <span className="text-orange-500">{endereco.rua}</span>
                </div>
              )}
              {endereco.numero && (
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-gray-700 min-w-[60px]">Número:</span>
                  <span className="text-orange-500">{endereco.numero}</span>
                </div>
              )}
              {endereco.bairro && (
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-gray-700 min-w-[60px]">Bairro:</span>
                  <span className="text-orange-500">{endereco.bairro}</span>
                </div>
              )}
              {endereco.cidade && (
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-gray-700 min-w-[60px]">Cidade:</span>
                  <span className="text-orange-500">{endereco.cidade}</span>
                </div>
              )}
              {endereco.estado && (
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-gray-700 min-w-[60px]">Estado:</span>
                  <span className="text-orange-500">{endereco.estado}</span>
                </div>
              )}
              {endereco.pais && (
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-gray-700 min-w-[60px]">País:</span>
                  <span className="text-orange-500">{endereco.pais}</span>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Navegação com abas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("turmas")}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "turmas"
                  ? "text-orange-500 border-b-2 border-orange-500 cursor-pointer"
                  : "text-gray-600 hover:text-orange-500 cursor-pointer"
              }`}
            >
              Turma
            </button>
            <button
              onClick={() => setActiveTab("cursos")}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === "cursos"
                  ? "text-orange-500 border-b-2 border-orange-500 cursor-pointer"
                  : "text-gray-600 hover:text-orange-500 cursor-pointer"
              }`}
            >
              Cursos
            </button>
          </div>
        </div>

        {/* Conteúdo das abas */}
        <div className="p-6">
          {activeTab === "turmas" && <TurmasTab turmas={professor.turmas || []} />}
          {activeTab === "cursos" && <CursosTab cursos={professor.cursos || []} />}
        </div>
      </div>
    </div>
  );
}

// Componente da aba Turmas
function TurmasTab({ turmas }) {
  return (
    <div className="space-y-4">
      {turmas.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhuma turma encontrada</p>
        </div>
      ) : (
        turmas.map((turma) => (
          <TurmaCard
            key={turma._id}
            nome={turma.nome || "Sem nome"}
            anoLetivo={turma.anoLetivo}
            turmaId={turma._id}
          />
        ))
      )}
    </div>
  );
}

// Componente de Card de Turma
function TurmaCard({ nome, anoLetivo, turmaId }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (turmaId) {
      navigate(`/turmas/${turmaId}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-gray-100 border border-gray-200 rounded-lg p-3 sm:p-4 flex items-center gap-3 sm:gap-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="shrink-0">
        <FiHome className="text-orange-500" size={24} />
      </div>
      <div className="flex-1">
        <h3 className="text-lg sm:text-xl font-bold text-orange-500">
          {nome}{anoLetivo ? ` ${anoLetivo}` : ""}
        </h3>
      </div>
    </div>
  );
}

// Componente da aba Cursos
function CursosTab({ cursos }) {
  return (
    <div className="space-y-4">
      {cursos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhum curso encontrado</p>
        </div>
      ) : (
        cursos.map((curso) => (
          <CursoCard
            key={curso._id}
            titulo={curso.titulo || "Sem título"}
            imagem={computadores}
            aulas={curso.capitulos?.length || 0}
            professor={curso.professorId?.userId?.name || "Professor não informado"}
            alunosInscritos={curso.alunosInscritos?.length || 0}
            cursoId={curso._id}
          />
        ))
      )}
    </div>
  );
}

// Componente de Card de Curso
function CursoCard({ titulo, imagem, aulas, professor, alunosInscritos, cursoId }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (cursoId) {
      navigate(`/curso/${cursoId}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-gray-100 border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-row cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Imagem à esquerda */}
      <div className="w-48 h-32 sm:w-56 sm:h-36 shrink-0">
        <img
          src={imagem}
          alt={titulo}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Conteúdo central */}
      <div className="flex-1 flex flex-col justify-center px-6 py-4">
        {/* Título */}
        <h3 className="text-xl sm:text-2xl font-bold text-orange-500 mb-2">
          {titulo}
        </h3>

        {/* Tag de aulas e nome do professor */}
        <div className="flex items-center gap-3 flex-wrap mb-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-orange-500 text-orange-500 text-sm font-medium">
            {aulas} Aulas
          </span>
          <span className="text-gray-600 text-sm">{professor}</span>
        </div>

        {/* Alunos inscritos */}
        <p className="text-gray-600 text-sm">
          Alunos inscritos: {alunosInscritos}
        </p>
      </div>
    </div>
  );
}
