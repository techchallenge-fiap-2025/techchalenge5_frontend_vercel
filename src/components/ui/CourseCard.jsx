import { useNavigate } from "react-router-dom";
import { FiBookOpen, FiUser, FiPlus, FiCheck } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import cursoService from "../../services/curso.service";
import {
  showSuccessToast,
  showErrorToast,
} from "../../components/feedback/toastConfig";
import { useState, useEffect } from "react";
import computadores from "../../assets/computadores.png";

export function CourseCard({
  title,
  description,
  capaUrl,
  aulas,
  professorName,
  materiaNome,
  showManageButton = true,
  showAddButton = false,
  cursoId,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isInscrendo, setIsInscrendo] = useState(false);
  const [estaInscrito, setEstaInscrito] = useState(false);
  const [isVerificando, setIsVerificando] = useState(true);

  // Verificar se o aluno está inscrito no curso
  useEffect(() => {
    const verificarInscricao = async () => {
      if (user?.role === "aluno" && cursoId && showAddButton) {
        setIsVerificando(true);
        try {
          const result = await cursoService.verificarInscricao(cursoId);
          if (result.success && result.data) {
            setEstaInscrito(result.data.estaInscrito || false);
          }
        } catch {
          setEstaInscrito(false);
        } finally {
          setIsVerificando(false);
        }
      } else {
        setIsVerificando(false);
      }
    };

    verificarInscricao();
  }, [user, cursoId, showAddButton]);

  const handleManageClick = (e) => {
    e.stopPropagation(); // Evitar que o clique no botão navegue para o curso
    if (cursoId) {
      navigate(`/curso/${cursoId}`);
    }
  };

  const handleAddClick = async (e) => {
    e.stopPropagation(); // Evitar que o clique no botão navegue para o curso
    if (!cursoId || isInscrendo) return;

    setIsInscrendo(true);
    try {
      const result = await cursoService.inscrever(cursoId);
      if (result.success) {
        setEstaInscrito(true);
        showSuccessToast("✅ Curso adicionado à sua lista de aprendizagem");
      } else {
        showErrorToast(result.error || "Erro ao adicionar curso à lista");
      }
    } catch {
      showErrorToast("Erro ao adicionar curso à lista");
    } finally {
      setIsInscrendo(false);
    }
  };

  const handleCardClick = () => {
    if (cursoId) {
      // Se showAddButton é true, está na página de cursos (dashboard para alunos)
      if (showAddButton) {
        navigate(`/cursos/${cursoId}`);
      } else if (user?.role === "professor") {
        // Professores vão para a página de visualização/gerenciamento do curso
        navigate(`/cursos/${cursoId}`);
      } else {
        // Alunos inscritos vão para a lista de cursos
        navigate(`/listacursos/curso/${cursoId}`);
      }
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-row cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Imagem à esquerda - Tamanhos fixos por dispositivo */}
      <div className="w-40 h-40 sm:w-64 md:w-80 lg:w-96 sm:h-48 md:h-56 lg:h-64 shrink-0">
        <img
          src={capaUrl || computadores}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Conteúdo à direita */}
      <div className="flex flex-col justify-between p-3 sm:p-6 flex-1 min-w-0">
        <div>
          {/* Título */}
          <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-orange-500 mb-2 sm:mb-3 truncate">
            {title}
          </h2>

          {/* Widget de quantidade de aulas, nome do professor e matéria */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="inline-flex items-center gap-1 sm:gap-2 bg-gray-100 rounded-full px-2 sm:px-3 py-1 w-fit">
              <FiBookOpen className="text-gray-600" size={14} />
              <span className="text-gray-700 font-medium text-xs sm:text-sm">
                {aulas} Aulas
              </span>
            </div>
            {professorName && (
              <div className="inline-flex items-center gap-1 sm:gap-2 bg-gray-100 rounded-full px-2 sm:px-3 py-1 w-fit">
                <FiUser className="text-gray-600" size={14} />
                <span className="text-gray-700 font-medium text-xs sm:text-sm truncate">
                  {professorName}
                </span>
                {materiaNome && (
                  <span className="text-gray-600 font-normal text-xs sm:text-sm truncate ml-1">
                    - {materiaNome}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Botões */}
        <div className="mt-4 sm:mt-6 flex justify-end">
          {showManageButton && user?.role !== "professor" && (
            <button
              onClick={handleManageClick}
              className="bg-orange-500 text-white hover:bg-orange-600 cursor-pointer transition-colors rounded-lg py-1.5 px-4 sm:py-2 sm:px-6 text-xs sm:text-sm font-medium"
            >
              Gerenciar Curso
            </button>
          )}
          {showAddButton && user?.role === "aluno" && !isVerificando && (
            <>
              {estaInscrito ? (
                <div className="flex items-center gap-2 text-green-600 px-4 py-2 rounded-lg bg-green-50 border border-green-200">
                  <FiCheck size={16} />
                  <span className="text-xs sm:text-sm font-medium">
                    Curso está na lista
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleAddClick}
                  disabled={isInscrendo}
                  className="bg-orange-500 text-white hover:bg-orange-600 cursor-pointer transition-colors rounded-lg py-1.5 px-4 sm:py-2 sm:px-6 text-xs sm:text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiPlus size={16} />
                  <span className="hidden sm:inline">
                    {isInscrendo ? "Adicionando..." : "Adicionar Curso à Lista"}
                  </span>
                  <span className="sm:hidden">
                    {isInscrendo ? "..." : "Adicionar"}
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
