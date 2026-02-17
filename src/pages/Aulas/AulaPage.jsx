import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import { Avatar } from "../../components/ui/Avatar";
import { FiCheck, FiX, FiArrowLeft } from "react-icons/fi";
import { useState, useEffect } from "react";
import turmaService from "../../services/turma.service";
import materiaService from "../../services/materia.service";
import attendanceService from "../../services/attendance.service";
import { showSuccessToast, showErrorToast } from "../../components/feedback/toastConfig";

export function AulaPage() {
  const { materiaId, turmaId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [materia, setMateria] = useState(null);
  const [turma, setTurma] = useState(null);
  const [dataAula, setDataAula] = useState(null);
  const [horarioAula, setHorarioAula] = useState(null);
  // Estado para controlar presença de cada aluno: { alunoId: true/false/null }
  const [presencas, setPresencas] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      if (!materiaId || !turmaId) {
        navigate("/aulas");
        return;
      }

      // Obter data e horário dos query params
      const dataParam = searchParams.get("data");
      const horarioParam = searchParams.get("horario");
      
      if (dataParam) {
        try {
          const dataObj = new Date(dataParam + "T12:00:00");
          if (!isNaN(dataObj.getTime())) {
            setDataAula(dataObj);
          }
        } catch (error) {
          console.error("Erro ao parsear data:", error);
        }
      }
      
      if (horarioParam) {
        setHorarioAula(horarioParam);
      }

      setIsLoading(true);
      try {
        const [materiaResult, turmaResult] = await Promise.all([
          materiaService.getById(materiaId),
          turmaService.getById(turmaId),
        ]);

        if (materiaResult.success) {
          setMateria(materiaResult.data);
        }

        if (turmaResult.success) {
          setTurma(turmaResult.data);
          // Os alunos já vêm populados no turmaResult.data.alunos
        }

        // Carregar presenças existentes para esta aula
        if (dataParam && turmaResult.success) {
          const dataObj = new Date(dataParam + "T12:00:00");
          if (!isNaN(dataObj.getTime())) {
            const dataInicio = new Date(dataObj);
            dataInicio.setHours(0, 0, 0, 0);
            const dataFim = new Date(dataObj);
            dataFim.setHours(23, 59, 59, 999);

            const presencasResult = await attendanceService.getAll({
              turmaId,
              materiaId,
              dataInicio: dataInicio.toISOString(),
              dataFim: dataFim.toISOString(),
            });

            if (presencasResult.success && presencasResult.data) {
              const presencasMap = {};
              presencasResult.data.forEach((presenca) => {
                if (presenca.alunoId && presenca.alunoId._id) {
                  presencasMap[presenca.alunoId._id] = presenca.presente;
                }
              });
              setPresencas(presencasMap);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar dados da aula:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [materiaId, turmaId, navigate, searchParams]);

  // Função para formatar data no formato dia/mês/ano
  const formatarData = (data) => {
    if (!data) return "";
    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  // Função para formatar horário
  const formatarHorario = (horario) => {
    if (!horario) return "";
    // horario vem no formato "HH:MM-HH:MM"
    const partes = horario.split("-");
    if (partes.length === 2) {
      return `${partes[0]} - ${partes[1]}`;
    }
    return horario;
  };

  // Função para marcar presença
  const handleMarcarPresenca = async (alunoId, presente) => {
    if (!dataAula || !turmaId || !materiaId) {
      showErrorToast("Dados insuficientes para marcar presença");
      return;
    }

    if (!alunoId) {
      showErrorToast("ID do aluno não encontrado");
      return;
    }

    try {
      // Formatar data para o formato esperado pelo backend (YYYY-MM-DD)
      // Garantir que a data seja tratada corretamente sem problemas de timezone
      const ano = dataAula.getFullYear();
      const mes = String(dataAula.getMonth() + 1).padStart(2, "0");
      const dia = String(dataAula.getDate()).padStart(2, "0");
      const dataFormatada = `${ano}-${mes}-${dia}`;
      
      const result = await attendanceService.marcarPresenca({
        turmaId,
        materiaId,
        data: dataFormatada,
        alunos: [{ alunoId, presente }],
      });

      if (result.success) {
        // Atualizar estado local
        setPresencas((prev) => ({
          ...prev,
          [alunoId]: presente,
        }));
        
        // Mostrar toast de sucesso
        const mensagem = presente 
          ? "✅ Presença marcada com sucesso" 
          : "✅ Falta registrada com sucesso";
        showSuccessToast(mensagem);
      } else {
        // Extrair mensagem de erro
        const errorMessage = result.error?.message || "Erro ao marcar presença";
        showErrorToast(errorMessage);
      }
    } catch (error) {
      // Tratar erros da API
      const errorMessage = error?.message || "Erro ao marcar presença";
      showErrorToast(errorMessage);
      console.error("Erro ao marcar presença:", error);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const titulo = materia && turma 
    ? `Aula: ${materia.nome} - ${turma.nome}`
    : "Aula";

  const dataFormatada = dataAula ? formatarData(dataAula) : "";
  const horarioFormatado = horarioAula ? formatarHorario(horarioAula) : "";

  // Função para formatar data no formato YYYY-MM-DD para navegação
  const formatarDataParaNavegacao = (data) => {
    if (!data) return null;
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  };

  const handleVoltar = () => {
    if (dataAula) {
      const dataFormatada = formatarDataParaNavegacao(dataAula);
      if (dataFormatada) {
        navigate(`/aulas/dia/${dataFormatada}`);
      } else {
        navigate("/aulas");
      }
    } else {
      navigate("/aulas");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header com mesmo design das outras páginas */}
      <div className="bg-white border-b border-gray-200 -mx-4 sm:-mx-6 lg:-mx-12 xl:-mx-16 2xl:-mx-24">
        <div className="px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-4">
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleVoltar}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
                title="Voltar para o dia"
              >
                <FiArrowLeft size={24} />
              </button>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-dark">{titulo}</h2>
            </div>
            {(dataFormatada || horarioFormatado) && (
              <div className="flex flex-col items-end text-sm sm:text-base text-gray-600 shrink-0">
                {dataFormatada && <span>{dataFormatada}</span>}
                {horarioFormatado && <span>{horarioFormatado}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Lista de Alunos */}
      <div className="px-4 sm:px-0">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Alunos da Turma</h3>
          
          {turma && turma.alunos && turma.alunos.length > 0 ? (
            <div className="space-y-3">
              {turma.alunos.map((aluno) => {
                const alunoObj = typeof aluno === 'object' && aluno !== null ? aluno : null;
                const userId = alunoObj?.userId;
                const alunoNome = userId?.name || "Aluno";
                const alunoEmail = userId?.email || "";
                const alunoFotoPerfil = userId?.fotoPerfil || null;
                const alunoId = alunoObj?._id;
                const statusPresenca = presencas[alunoId]; // true = presente, false = falta, undefined/null = não marcado
                
                return (
                  <div
                    key={alunoObj?._id || aluno}
                    className="flex items-center justify-between gap-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {/* Avatar, Nome e Email */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar
                        fotoPerfil={alunoFotoPerfil}
                        name={alunoNome}
                        size="md"
                      />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium text-gray-800 truncate">
                          {alunoNome}
                        </span>
                        <span className="text-sm text-gray-600 truncate">
                          {alunoEmail}
                        </span>
                      </div>
                    </div>
                    
                    {/* Botões Check e X ou Status de Presença */}
                    <div className="flex items-center gap-2 shrink-0">
                      {statusPresenca === undefined || statusPresenca === null ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleMarcarPresenca(alunoId, true)}
                            className="w-10 h-10 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors flex items-center justify-center"
                            title="Marcar presença"
                          >
                            <FiCheck size={20} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarcarPresenca(alunoId, false)}
                            className="w-10 h-10 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center"
                            title="Marcar falta"
                          >
                            <FiX size={20} />
                          </button>
                        </>
                      ) : statusPresenca === true ? (
                        <span className="text-green-600 font-bold">Presente</span>
                      ) : (
                        <span className="text-red-600 font-bold">Faltou</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">
              Nenhum aluno encontrado nesta turma.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
