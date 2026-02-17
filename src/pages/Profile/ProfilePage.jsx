import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMail,
  FiUser,
  FiMapPin,
  FiHome,
  FiBookOpen,
} from "react-icons/fi";
import alunoService from "../../services/aluno.service";
import professorService from "../../services/professor.service";
import { showErrorToast } from "../../components/feedback/toastConfig";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import { getInitials } from "../../utils/userUtils";
import { useAuth } from "../../context/AuthContext";
import computadores from "../../assets/computadores.png";

// Função para formatar CPF
const formatCPF = (cpf) => {
  if (!cpf) return "-";
  const cpfClean = cpf.replace(/\D/g, "");
  return cpfClean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

export function ProfilePage() {
  const { user: authUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("turmas");

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      let result;
      if (authUser?.role === "aluno") {
        result = await alunoService.getMe();
      } else if (authUser?.role === "professor") {
        result = await professorService.getMe();
      } else {
        showErrorToast("Acesso não autorizado");
        setIsLoading(false);
        return;
      }

      if (result.success) {
        setProfileData(result.data);
      } else {
        showErrorToast(result.error || "Erro ao carregar perfil");
      }
    } catch (error) {
      showErrorToast("Erro ao carregar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (authUser) {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Perfil não encontrado</p>
      </div>
    );
  }

  const user = profileData.userId || {};
  const endereco = user.endereco || {};

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header com nome */}
      <div className="bg-white border-b border-gray-200 -mx-4 sm:-mx-6 lg:-mx-12 xl:-mx-16 2xl:-mx-24">
        <div className="px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-3 sm:py-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 truncate">
            {user.name || "Nome não informado"}
          </h1>
        </div>
      </div>

      {/* Card principal com informações */}
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

          {/* Turma (apenas para aluno) */}
          {authUser?.role === "aluno" && (
            <div className="flex items-start sm:items-center gap-2 sm:gap-3">
              <FiHome
                className="text-orange-500 shrink-0 mt-0.5 sm:mt-0"
                size={18}
              />
              <div className="min-w-0 flex-1">
                <span className="text-xs sm:text-sm text-gray-600">Turma:</span>
                <p className="text-orange-500 font-medium text-sm sm:text-base">
                  {profileData.turmaId &&
                  typeof profileData.turmaId === "object" &&
                  profileData.turmaId.nome
                    ? `${profileData.turmaId.nome}${profileData.turmaId.anoLetivo ? ` (${profileData.turmaId.anoLetivo})` : ""}`
                    : profileData.turmaId?.nome || "Sem turma"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Responsáveis (apenas para aluno) */}
        {authUser?.role === "aluno" &&
          profileData.responsaveis &&
          profileData.responsaveis.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
                Responsáveis
              </h3>
              <div className="space-y-2">
                {profileData.responsaveis.map((responsavel, index) => (
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

        {/* Matérias (apenas para professor) */}
        {authUser?.role === "professor" &&
          profileData.materias &&
          profileData.materias.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiBookOpen className="text-orange-500" />
                Matérias
              </h3>
              <div className="border-2 border-orange-500 rounded-lg p-4">
                <div className="flex flex-wrap gap-2">
                  {profileData.materias.map((materia, index) => (
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

      {/* Navegação com abas - apenas para professor */}
      {authUser?.role === "professor" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Tabs */}
          <div className="border-b border-gray-200 overflow-x-auto">
            <div className="flex min-w-max">
              <button
                onClick={() => setActiveTab("turmas")}
                className={`px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === "turmas"
                    ? "text-orange-500 border-b-2 border-orange-500 cursor-pointer"
                    : "text-gray-600 hover:text-orange-500 cursor-pointer"
                }`}
              >
                Turmas
              </button>
              <button
                onClick={() => setActiveTab("cursos")}
                className={`px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
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
          <div className="p-3 sm:p-6">
            {activeTab === "turmas" && (
              <TurmasTab turmas={profileData.turmas || []} />
            )}
            {activeTab === "cursos" && (
              <CursosTabProfessor cursos={profileData.cursos || []} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente da aba Turmas (para professor)
function TurmasTab({ turmas }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {turmas.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhuma turma encontrada</p>
        </div>
      ) : (
        turmas.map((turma) => (
          <div
            key={turma._id}
            onClick={() => navigate(`/turmas/${turma._id}`)}
            className="bg-gray-100 border border-gray-200 rounded-lg p-3 sm:p-4 flex items-center gap-3 sm:gap-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="shrink-0">
              <FiHome className="text-orange-500" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-orange-500">
                {turma.nome}
                {turma.anoLetivo ? ` ${turma.anoLetivo}` : ""}
              </h3>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Componente da aba Cursos (para professor)
function CursosTabProfessor({ cursos }) {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {cursos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhum curso encontrado</p>
        </div>
      ) : (
        cursos.map((curso) => {
          const totalAulas =
            curso.capitulos?.reduce(
              (acc, cap) => acc + (cap.aulas?.length || 0),
              0,
            ) || 0;
          const alunosInscritos = curso.alunosInscritos?.length || 0;

          return (
            <div
              key={curso._id}
              onClick={() => navigate(`/curso/${curso._id}`)}
              className="bg-gray-100 border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-row cursor-pointer hover:shadow-md transition-shadow"
            >
              {/* Imagem à esquerda */}
              <div className="w-48 h-32 sm:w-56 sm:h-36 shrink-0">
                <img
                  src={curso.capa?.url || computadores}
                  alt={curso.titulo}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Conteúdo central */}
              <div className="flex-1 flex flex-col justify-center px-6 py-4">
                {/* Título */}
                <h3 className="text-xl sm:text-2xl font-bold text-orange-500 mb-2">
                  {curso.titulo || "Sem título"}
                </h3>

                {/* Tag de aulas e nome do professor */}
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full border border-orange-500 text-orange-500 text-sm font-medium">
                    {totalAulas} Aulas
                  </span>
                </div>

                {/* Alunos inscritos */}
                <p className="text-gray-600 text-sm">
                  Alunos inscritos: {alunosInscritos}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
