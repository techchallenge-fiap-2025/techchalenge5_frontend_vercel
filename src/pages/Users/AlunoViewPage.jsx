import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiLock,
  FiUnlock,
  FiMail,
  FiUser,
  FiMapPin,
  FiCalendar,
  FiHome,
  FiAward,
} from "react-icons/fi";
import { PageHeader } from "../../components/ui/PageHeader";
import { StatusBadge } from "../../components/ui/StatusBadge";
import alunoService from "../../services/aluno.service";
import {
  showErrorToast,
  showSuccessToast,
} from "../../components/feedback/toastConfig";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import computadores from "../../assets/computadores.png";
import { getInitials } from "../../utils/userUtils";
import progressoCursoService from "../../services/progressoCurso.service";

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

export function AlunoViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [aluno, setAluno] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [activeTab, setActiveTab] = useState("boletim");
  const [semestreSelecionado, setSemestreSelecionado] = useState("1");

  const fetchAluno = async () => {
    setIsLoading(true);
    try {
      const result = await alunoService.getById(id);
      if (result.success) {
        setAluno(result.data);
      } else {
        showErrorToast(result.error || "Erro ao carregar dados do aluno");
        navigate("/alunos");
      }
    } catch {
      showErrorToast("Erro ao carregar dados do aluno");
      navigate("/alunos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAluno();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleToggleActive = async () => {
    if (isToggling) return;

    setIsToggling(true);
    try {
      const result = await alunoService.toggleActive(id);
      if (result.success) {
        // Atualizar o estado local com os dados atualizados
        setAluno(result.data.aluno);
        const isActive = result.data.aluno.userId?.active;
        showSuccessToast(
          isActive
            ? "✅ Usuário ativado com sucesso"
            : "✅ Usuário bloqueado com sucesso",
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

  if (!aluno) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Aluno não encontrado</p>
      </div>
    );
  }

  const user = aluno.userId || {};
  const endereco = user.endereco || {};

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header com nome e ícone de cadeado */}
      <div className="bg-white border-b border-gray-200 -mx-4 sm:-mx-6 lg:-mx-12 xl:-mx-16 2xl:-mx-24">
        <div className="px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-3 sm:py-4">
          <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 truncate flex-1">
              {user.name || "Nome não informado"}
            </h1>
            <button
              onClick={handleToggleActive}
              disabled={isToggling}
              className="flex items-center gap-2 transition-opacity hover:opacity-80 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              title={
                user.active === false
                  ? "Clique para ativar"
                  : "Clique para bloquear"
              }
            >
              {user.active === false ? (
                <FiLock className="text-red-500" size={20} />
              ) : (
                <FiUnlock className="text-green-500" size={20} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Card principal com informações do aluno */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Foto de perfil ou Iniciais */}
        <div className="flex justify-center">
          <div className="relative">
            {user.fotoPerfil?.url ? (
              <img
                src={user.fotoPerfil.url}
                alt={user.name}
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-orange-500"
              />
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-orange-500 flex items-center justify-center border-4 border-orange-500">
                <span className="text-white font-bold text-2xl sm:text-4xl">
                  {getInitials(user.name || "Nome não informado")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Informações pessoais */}
        <div className="space-y-3 sm:space-y-4">
          {/* Email */}
          <div className="flex items-start sm:items-center gap-2 sm:gap-3">
            <FiMail
              className="text-orange-500 shrink-0 mt-0.5 sm:mt-0"
              size={18}
            />
            <div className="min-w-0 flex-1">
              <span className="text-xs sm:text-sm text-gray-600">Email:</span>
              <p className="text-orange-500 font-medium text-sm sm:text-base">
                {user.email || "-"}
              </p>
            </div>
          </div>

          {/* CPF */}
          <div className="flex items-start sm:items-center gap-2 sm:gap-3">
            <FiUser
              className="text-orange-500 shrink-0 mt-0.5 sm:mt-0"
              size={18}
            />
            <div className="min-w-0 flex-1">
              <span className="text-xs sm:text-sm text-gray-600">CPF:</span>
              <p className="text-orange-500 font-medium text-sm sm:text-base">
                {formatCPF(user.cpf)}
              </p>
            </div>
          </div>

          {/* Idade */}
          <div className="flex items-start sm:items-center gap-2 sm:gap-3">
            <FiUser
              className="text-orange-500 shrink-0 mt-0.5 sm:mt-0"
              size={18}
            />
            <div className="min-w-0 flex-1">
              <span className="text-xs sm:text-sm text-gray-600">Idade:</span>
              <p className="text-orange-500 font-medium text-sm sm:text-base">
                {user.idade || "-"}
              </p>
            </div>
          </div>

          {/* Última vez logado */}
          <div className="flex items-start sm:items-center gap-2 sm:gap-3">
            <FiCalendar
              className="text-orange-500 shrink-0 mt-0.5 sm:mt-0"
              size={18}
            />
            <div className="min-w-0 flex-1">
              <span className="text-xs sm:text-sm text-gray-600">
                Última Vez Logado:
              </span>
              <p className="text-orange-500 font-medium text-sm sm:text-base">
                {formatDate(user.lastLoginAt) || "-"}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-start sm:items-center gap-2 sm:gap-3">
            <FiUser
              className="text-orange-500 shrink-0 mt-0.5 sm:mt-0"
              size={18}
            />
            <div className="min-w-0 flex-1">
              <span className="text-xs sm:text-sm text-gray-600">Status:</span>
              <p className="mt-1">
                <StatusBadge status={aluno.status || "ativo"} />
              </p>
            </div>
          </div>

          {/* Turma */}
          <div className="flex items-start sm:items-center gap-2 sm:gap-3">
            <FiHome
              className="text-orange-500 shrink-0 mt-0.5 sm:mt-0"
              size={18}
            />
            <div className="min-w-0 flex-1">
              <span className="text-xs sm:text-sm text-gray-600">Turma:</span>
              <p className="text-orange-500 font-medium text-sm sm:text-base">
                {aluno.turmaId &&
                typeof aluno.turmaId === "object" &&
                aluno.turmaId.nome
                  ? `${aluno.turmaId.nome}${aluno.turmaId.anoLetivo ? ` (${aluno.turmaId.anoLetivo})` : ""}`
                  : aluno.turmaId?.nome || "Sem turma"}
              </p>
            </div>
          </div>
        </div>

        {/* Responsáveis */}
        {aluno.responsaveis && aluno.responsaveis.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
              Responsáveis
            </h3>
            <div className="space-y-2">
              {aluno.responsaveis.map((responsavel, index) => (
                <div
                  key={responsavel._id || index}
                  className="flex items-center gap-2"
                >
                  <FiUser className="text-orange-500 shrink-0" size={16} />
                  <span className="text-orange-500 font-medium text-sm sm:text-base">
                    {responsavel.nome || "Nome não informado"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Endereço */}
        {(endereco.cep ||
          endereco.rua ||
          endereco.numero ||
          endereco.bairro ||
          endereco.cidade ||
          endereco.estado) && (
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FiMapPin className="text-orange-500" size={18} />
              Endereço
            </h3>
            <div className="border-2 border-orange-500 rounded-lg p-3 sm:p-4 space-y-2">
              {endereco.cep && (
                <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 sm:min-w-[60px]">
                    CEP:
                  </span>
                  <span className="text-orange-500 text-sm sm:text-base">
                    {endereco.cep}
                  </span>
                </div>
              )}
              {endereco.rua && (
                <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 sm:min-w-[60px]">
                    Rua:
                  </span>
                  <span className="text-orange-500 text-sm sm:text-base">
                    {endereco.rua}
                  </span>
                </div>
              )}
              {endereco.numero && (
                <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 sm:min-w-[60px]">
                    Número:
                  </span>
                  <span className="text-orange-500 text-sm sm:text-base">
                    {endereco.numero}
                  </span>
                </div>
              )}
              {endereco.bairro && (
                <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 sm:min-w-[60px]">
                    Bairro:
                  </span>
                  <span className="text-orange-500 text-sm sm:text-base">
                    {endereco.bairro}
                  </span>
                </div>
              )}
              {endereco.cidade && (
                <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 sm:min-w-[60px]">
                    Cidade:
                  </span>
                  <span className="text-orange-500 text-sm sm:text-base">
                    {endereco.cidade}
                  </span>
                </div>
              )}
              {endereco.estado && (
                <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 sm:min-w-[60px]">
                    Estado:
                  </span>
                  <span className="text-orange-500 text-sm sm:text-base">
                    {endereco.estado}
                  </span>
                </div>
              )}
              {endereco.pais && (
                <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 sm:min-w-[60px]">
                    País:
                  </span>
                  <span className="text-orange-500 text-sm sm:text-base">
                    {endereco.pais}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navegação com abas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex min-w-max">
            <button
              onClick={() => setActiveTab("boletim")}
              className={`px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === "boletim"
                  ? "text-orange-500 border-b-2 border-orange-500 cursor-pointer"
                  : "text-gray-600 hover:text-orange-500 cursor-pointer"
              }`}
            >
              Boletim
            </button>
            <button
              onClick={() => setActiveTab("cursos")}
              className={`px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === "cursos"
                  ? "text-orange-500 border-b-2 border-orange-500 cursor-pointer"
                  : "text-gray-600 hover:text-orange-500 cursor-pointer "
              }`}
            >
              Cursos
            </button>
          </div>
        </div>

        {/* Conteúdo das abas */}
        <div className="p-3 sm:p-6">
          {activeTab === "boletim" && (
            <BoletimTab
              alunoId={id}
              semestreSelecionado={semestreSelecionado}
              setSemestreSelecionado={setSemestreSelecionado}
            />
          )}
          {activeTab === "cursos" && <CursosTab alunoId={id} />}
        </div>
      </div>
    </div>
  );
}

// Componente da aba Boletim
function BoletimTab({ alunoId, semestreSelecionado, setSemestreSelecionado }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTurmas, setIsLoadingTurmas] = useState(true);
  const [materias, setMaterias] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState(null);

  // Função para formatar label da turma no select
  const formatarLabelTurma = (turma) => {
    const periodoMap = {
      manha: "Manhã",
      tarde: "Tarde",
      noite: "Noite",
      integral: "Integral",
    };
    const nivelMap = {
      maternal: "Maternal",
      fundamental: "Fundamental",
      ensinoMedio: "Ensino Médio",
    };
    const periodo = periodoMap[turma.periodo] || turma.periodo;
    const nivel = nivelMap[turma.nivelEducacional] || turma.nivelEducacional;
    const status = turma.status === "ativa" ? "(Ativa)" : "(Encerrada)";
    return `${turma.nome} - ${turma.anoLetivo} - ${periodo} - ${nivel} ${status}`;
  };

  // Buscar turmas do aluno
  useEffect(() => {
    const fetchTurmas = async () => {
      setIsLoadingTurmas(true);
      try {
        const result = await alunoService.getTurmasAluno(alunoId);
        if (result.success && result.data) {
          const turmasData = result.data || [];
          setTurmas(turmasData);

          // Selecionar turma atual por padrão (ativa do ano atual)
          const anoAtual = new Date().getFullYear();
          const turmaAtualEncontrada = turmasData.find(
            (t) => t.anoLetivo === anoAtual && t.status === "ativa",
          );
          if (turmaAtualEncontrada) {
            setTurmaSelecionada(turmaAtualEncontrada._id);
          } else if (turmasData.length > 0) {
            // Se não houver turma ativa do ano atual, selecionar a primeira
            setTurmaSelecionada(turmasData[0]._id);
          }
        } else {
          showErrorToast(result.error || "Erro ao carregar turmas");
          setTurmas([]);
        }
      } catch {
        showErrorToast("Erro ao carregar turmas");
        setTurmas([]);
      } finally {
        setIsLoadingTurmas(false);
      }
    };

    if (alunoId) {
      fetchTurmas();
    }
  }, [alunoId]);

  // Buscar dados do boletim
  useEffect(() => {
    const fetchBoletim = async () => {
      if (!turmaSelecionada) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const result = await alunoService.getBoletimAluno(alunoId, {
          turmaId: turmaSelecionada,
        });
        if (result.success && result.data) {
          const boletim = result.data.boletim || [];
          setMaterias(boletim);
        } else {
          showErrorToast(result.error || "Erro ao carregar boletim");
          setMaterias([]);
        }
      } catch {
        showErrorToast("Erro ao carregar boletim");
        setMaterias([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (alunoId && turmaSelecionada) {
      fetchBoletim();
    }
  }, [alunoId, turmaSelecionada]);

  // Função para formatar valor da nota
  const formatarNota = (valor) => {
    if (valor === "-") return "-";
    if (valor === "*") return "*";
    if (valor === null || valor === undefined) return "-";
    return valor;
  };

  // Função para determinar cor da situação
  const getSituacaoColor = (situacao) => {
    if (situacao === "Aprovado") return "text-green-600";
    if (situacao === "Reprovado") return "text-red-600";
    return "text-gray-600";
  };

  if (isLoading || isLoadingTurmas) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Carregando boletim...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Select de Turmas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecionar Turma
        </label>
        <select
          value={turmaSelecionada || ""}
          onChange={(e) => setTurmaSelecionada(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
        >
          {turmas.length === 0 ? (
            <option value="">Nenhuma turma encontrada</option>
          ) : (
            turmas.map((turma) => (
              <option key={turma._id} value={turma._id}>
                {formatarLabelTurma(turma)}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Select para mobile/tablet - mostrar apenas em telas menores que lg */}
      <div className="lg:hidden">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Selecionar Período
        </label>
        <select
          value={semestreSelecionado}
          onChange={(e) => setSemestreSelecionado(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
        >
          <option value="1">1º Semestre</option>
          <option value="2">2º Semestre</option>
          <option value="final">Final</option>
        </select>
      </div>

      {/* Tabela do Boletim - Desktop (mostrar todos os semestres) */}
      <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 border-r border-gray-200 sticky left-0 bg-gray-50 z-10">
                    Matérias
                  </th>
                  {/* Semestre 1 */}
                  <th
                    colSpan="7"
                    className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 bg-blue-50"
                  >
                    1º Semestre
                  </th>
                  {/* Semestre 2 */}
                  <th
                    colSpan="7"
                    className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 bg-green-50"
                  >
                    2º Semestre
                  </th>
                  {/* Média Final e Situação */}
                  <th
                    colSpan="2"
                    className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 bg-purple-50"
                  >
                    Final
                  </th>
                </tr>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-gray-700 border-r border-gray-200 sticky left-0 bg-gray-50 z-10">
                    {/* Matérias header - vazio */}
                  </th>
                  {/* Semestre 1 - Colunas */}
                  <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-blue-50">
                    PV1
                  </th>
                  <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-blue-50">
                    PV2
                  </th>
                  <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-blue-50">
                    PV3
                  </th>
                  <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-blue-50">
                    TB1
                  </th>
                  <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-blue-50">
                    TB2
                  </th>
                  <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-blue-50">
                    F
                  </th>
                  <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-blue-50 border-r border-gray-200">
                    Média
                  </th>
                  {/* Semestre 2 - Colunas */}
                  <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-green-50">
                    PV1
                  </th>
                  <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-green-50">
                    PV2
                  </th>
                  <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-green-50">
                    PV3
                  </th>
                  <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-green-50">
                    TB1
                  </th>
                  <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-green-50">
                    TB2
                  </th>
                  <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-green-50">
                    F
                  </th>
                  <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-green-50 border-r border-gray-200">
                    Média
                  </th>
                  {/* Média Final e Situação */}
                  <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-purple-50">
                    MF
                  </th>
                  <th className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 bg-purple-50">
                    Situação
                  </th>
                </tr>
              </thead>
              <tbody>
                {materias.length === 0 ? (
                  <tr>
                    <td
                      colSpan="17"
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Nenhuma matéria encontrada ou aluno não está em nenhuma
                      turma.
                    </td>
                  </tr>
                ) : (
                  materias.map((materia, index) => (
                    <tr
                      key={materia.materiaId || index}
                      className={`border-b border-gray-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900 border-r border-gray-200 sticky left-0 bg-inherit z-10 text-center lg:text-left">
                        {materia.materiaNome}
                      </td>
                      {/* Semestre 1 - Dados */}
                      <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                        {formatarNota(materia.semestre1.pv1)}
                      </td>
                      <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                        {formatarNota(materia.semestre1.pv2)}
                      </td>
                      <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                        {formatarNota(materia.semestre1.pv3)}
                      </td>
                      <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                        {formatarNota(materia.semestre1.tb1)}
                      </td>
                      <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                        {formatarNota(materia.semestre1.tb2)}
                      </td>
                      <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                        {materia.semestre1.f}%
                      </td>
                      <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm font-semibold text-gray-900 bg-blue-50 border-r border-gray-200">
                        {materia.semestre1.media !== null
                          ? materia.semestre1.media
                          : "-"}
                      </td>
                      {/* Semestre 2 - Dados */}
                      <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                        {formatarNota(materia.semestre2.pv1)}
                      </td>
                      <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                        {formatarNota(materia.semestre2.pv2)}
                      </td>
                      <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                        {formatarNota(materia.semestre2.pv3)}
                      </td>
                      <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                        {formatarNota(materia.semestre2.tb1)}
                      </td>
                      <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                        {formatarNota(materia.semestre2.tb2)}
                      </td>
                      <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                        {materia.semestre2.f}%
                      </td>
                      <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm font-semibold text-gray-900 bg-green-50 border-r border-gray-200">
                        {materia.semestre2.media !== null
                          ? materia.semestre2.media
                          : "-"}
                      </td>
                      {/* Média Final e Situação */}
                      <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm font-semibold text-gray-900 bg-purple-50">
                        {materia.mediaFinal !== null ? materia.mediaFinal : "-"}
                      </td>
                      <td
                        className={`px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm font-medium bg-purple-50 ${getSituacaoColor(materia.situacao)}`}
                      >
                        {materia.situacao}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tabela do Boletim - Mobile/Tablet (mostrar apenas o semestre selecionado) */}
      <div className="lg:hidden bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="w-full min-w-[400px]">
              <thead>
                {semestreSelecionado === "final" ? (
                  <>
                    {/* Header para Final */}
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 border-r border-gray-200 sticky left-0 bg-gray-50 z-10">
                        Matérias
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 bg-purple-50">
                        Média Final
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 bg-purple-50">
                        Situação
                      </th>
                    </tr>
                  </>
                ) : (
                  <>
                    {/* Header para Semestre 1 ou 2 */}
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 border-r border-gray-200 sticky left-0 bg-gray-50 z-10">
                        Matérias
                      </th>
                      <th
                        colSpan="7"
                        className={`px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 ${
                          semestreSelecionado === "1"
                            ? "bg-blue-50"
                            : "bg-green-50"
                        }`}
                      >
                        {semestreSelecionado === "1"
                          ? "1º Semestre"
                          : "2º Semestre"}
                      </th>
                    </tr>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 border-r border-gray-200 sticky left-0 bg-gray-50 z-10">
                        {/* Matérias header - vazio */}
                      </th>
                      <th
                        className={`px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 ${
                          semestreSelecionado === "1"
                            ? "bg-blue-50"
                            : "bg-green-50"
                        }`}
                      >
                        PV1
                      </th>
                      <th
                        className={`px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 ${
                          semestreSelecionado === "1"
                            ? "bg-blue-50"
                            : "bg-green-50"
                        }`}
                      >
                        PV2
                      </th>
                      <th
                        className={`px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 ${
                          semestreSelecionado === "1"
                            ? "bg-blue-50"
                            : "bg-green-50"
                        }`}
                      >
                        PV3
                      </th>
                      <th
                        className={`px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 ${
                          semestreSelecionado === "1"
                            ? "bg-blue-50"
                            : "bg-green-50"
                        }`}
                      >
                        TB1
                      </th>
                      <th
                        className={`px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 ${
                          semestreSelecionado === "1"
                            ? "bg-blue-50"
                            : "bg-green-50"
                        }`}
                      >
                        TB2
                      </th>
                      <th
                        className={`px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 ${
                          semestreSelecionado === "1"
                            ? "bg-blue-50"
                            : "bg-green-50"
                        }`}
                      >
                        F
                      </th>
                      <th
                        className={`px-2 sm:px-3 py-1 sm:py-2 text-center text-xs font-medium text-gray-600 border-r border-gray-200 ${
                          semestreSelecionado === "1"
                            ? "bg-blue-50"
                            : "bg-green-50"
                        }`}
                      >
                        Média
                      </th>
                    </tr>
                  </>
                )}
              </thead>
              <tbody>
                {materias.length === 0 ? (
                  <tr>
                    <td
                      colSpan="17"
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Nenhuma matéria encontrada ou aluno não está em nenhuma
                      turma.
                    </td>
                  </tr>
                ) : (
                  materias.map((materia, index) => (
                    <tr
                      key={materia.materiaId || index}
                      className={`border-b border-gray-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900 border-r border-gray-200 sticky left-0 bg-inherit z-10 text-center lg:text-left">
                        {materia.materiaNome}
                      </td>
                      {semestreSelecionado === "final" ? (
                        <>
                          {/* Mostrar apenas Média Final e Situação */}
                          <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm font-semibold text-gray-900 bg-purple-50">
                            {materia.mediaFinal !== null
                              ? materia.mediaFinal
                              : "-"}
                          </td>
                          <td
                            className={`px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm font-medium bg-purple-50 ${getSituacaoColor(
                              materia.situacao,
                            )}`}
                          >
                            {materia.situacao}
                          </td>
                        </>
                      ) : semestreSelecionado === "1" ? (
                        <>
                          {/* Mostrar dados do Semestre 1 */}
                          <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                            {formatarNota(materia.semestre1.pv1)}
                          </td>
                          <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                            {formatarNota(materia.semestre1.pv2)}
                          </td>
                          <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                            {formatarNota(materia.semestre1.pv3)}
                          </td>
                          <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                            {formatarNota(materia.semestre1.tb1)}
                          </td>
                          <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                            {formatarNota(materia.semestre1.tb2)}
                          </td>
                          <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-blue-50">
                            {materia.semestre1.f}%
                          </td>
                          <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm font-semibold text-gray-900 bg-blue-50 border-r border-gray-200">
                            {materia.semestre1.media !== null
                              ? materia.semestre1.media
                              : "-"}
                          </td>
                        </>
                      ) : (
                        <>
                          {/* Mostrar dados do Semestre 2 */}
                          <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                            {formatarNota(materia.semestre2.pv1)}
                          </td>
                          <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                            {formatarNota(materia.semestre2.pv2)}
                          </td>
                          <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                            {formatarNota(materia.semestre2.pv3)}
                          </td>
                          <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                            {formatarNota(materia.semestre2.tb1)}
                          </td>
                          <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                            {formatarNota(materia.semestre2.tb2)}
                          </td>
                          <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm text-gray-700 bg-green-50">
                            {materia.semestre2.f}%
                          </td>
                          <td className="px-2 sm:px-3 py-1 sm:py-2 text-center text-xs sm:text-sm font-semibold text-gray-900 bg-green-50 border-r border-gray-200">
                            {materia.semestre2.media !== null
                              ? materia.semestre2.media
                              : "-"}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Card de Legenda */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          Legenda
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">PV1</span>
            <span className="text-xs text-gray-600">Prova 1</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">PV2</span>
            <span className="text-xs text-gray-600">Prova 2</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">PV3</span>
            <span className="text-xs text-gray-600">Prova 3</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">TB1</span>
            <span className="text-xs text-gray-600">Trabalho 1</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">TB2</span>
            <span className="text-xs text-gray-600">Trabalho 2</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">F</span>
            <span className="text-xs text-gray-600">Frequência</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">Média</span>
            <span className="text-xs text-gray-600">Média do Semestre</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">MF</span>
            <span className="text-xs text-gray-600">Média Final</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">Situação</span>
            <span className="text-xs text-gray-600">Status do Aluno</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">-</span>
            <span className="text-xs text-gray-600">
              Prova/Trabalho marcado pelo professor
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">*</span>
            <span className="text-xs text-gray-600">
              Prova/Trabalho não marcado
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente da aba Cursos
function CursosTab({ alunoId }) {
  const [cursos, setCursos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCursos = async () => {
      if (!alunoId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const result = await progressoCursoService.getCursosAluno(alunoId);
        if (result.success && result.data) {
          const progressos = result.data.progressos || [];

          // Transformar progressos em cursos para exibição
          const cursosFormatados = progressos
            .filter((p) => p.cursoId) // Filtrar cursos que existem
            .map((progresso) => {
              const curso = progresso.cursoId;
              const totalAulas =
                curso.capitulos?.reduce(
                  (acc, cap) => acc + (cap.aulas?.length || 0),
                  0,
                ) || 0;

              return {
                id: curso._id,
                titulo: curso.titulo || "Curso sem título",
                imagem: curso.capa?.url || computadores,
                aulas: totalAulas,
                professor:
                  curso.professorId?.userId?.name || "Professor não informado",
                progresso: Math.round(progresso.progressoPercentual || 0),
                cursoId: curso._id,
              };
            });

          setCursos(cursosFormatados);
        } else {
          showErrorToast(result.error || "Erro ao carregar cursos");
          setCursos([]);
        }
      } catch {
        showErrorToast("Erro ao carregar cursos");
        setCursos([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCursos();
  }, [alunoId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Carregando cursos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cursos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhum curso encontrado</p>
        </div>
      ) : (
        cursos.map((curso) => (
          <CursoCard
            key={curso.id}
            titulo={curso.titulo}
            imagem={curso.imagem}
            aulas={curso.aulas}
            professor={curso.professor}
            progresso={curso.progresso}
            cursoId={curso.cursoId}
          />
        ))
      )}
    </div>
  );
}

// Componente de Card de Curso
function CursoCard({ titulo, imagem, aulas, professor, progresso, cursoId }) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (cursoId) {
      // Admin visualiza curso do aluno através da rota de cursos
      navigate(`/cursos/${cursoId}`);
    }
  };

  // Calcular o ângulo do círculo de progresso
  const circumference = 2 * Math.PI * 40; // raio = 40
  const offset = circumference - (progresso / 100) * circumference;

  return (
    <div
      onClick={handleCardClick}
      className="bg-gray-100 border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col sm:flex-row cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Imagem */}
      <div className="w-full h-32 sm:w-48 sm:h-32 md:w-56 md:h-36 shrink-0">
        <img src={imagem} alt={titulo} className="w-full h-full object-cover" />
      </div>

      {/* Conteúdo central - Mobile/Tablet: justify-between com porcentagem */}
      <div className="flex-1 flex flex-col sm:flex-row sm:justify-between px-4 sm:px-6 py-3 sm:py-4">
        {/* Conteúdo do curso */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Título */}
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-orange-500 mb-2">
            {titulo}
          </h3>

          {/* Tag de aulas e nome do professor - Mobile/Tablet: justify-between com porcentagem */}
          <div className="flex items-center justify-between lg:justify-start gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full border border-orange-500 text-orange-500 text-xs sm:text-sm font-medium">
                {aulas} Aulas
              </span>
              <span className="text-gray-600 text-xs sm:text-sm">
                {professor}
              </span>
            </div>

            {/* Porcentagem - visível apenas em mobile/tablet */}
            <div className="lg:hidden flex items-center">
              {progresso === 100 ? (
                <FiAward className="text-yellow-500" size={20} />
              ) : (
                <span className="text-yellow-500 font-bold text-sm sm:text-base">
                  {progresso}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Indicador de progresso circular à direita - Desktop apenas */}
        <div className="hidden lg:flex items-center justify-center px-4 sm:px-6 py-3 sm:py-4 shrink-0">
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24">
            <svg
              className="transform -rotate-90 w-full h-full"
              viewBox="0 0 100 100"
            >
              {/* Círculo de fundo */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              {/* Círculo de progresso */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>
            {/* Porcentagem ou coroa no centro */}
            <div className="absolute inset-0 flex items-center justify-center">
              {progresso === 100 ? (
                <FiAward className="text-yellow-500" size={32} />
              ) : (
                <span className="text-yellow-500 font-bold text-lg sm:text-xl">
                  {progresso}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
