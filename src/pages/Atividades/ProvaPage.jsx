import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import { Avatar } from "../../components/ui/Avatar";
import { FiCheck, FiArrowLeft } from "react-icons/fi";
import { useState, useEffect } from "react";
import turmaService from "../../services/turma.service";
import atividadeService from "../../services/atividade.service";
import notaAtividadeService from "../../services/notaAtividade.service";
import attendanceService from "../../services/attendance.service";
import aulaSemanalService from "../../services/aulaSemanal.service";
import { showSuccessToast, showErrorToast } from "../../components/feedback/toastConfig";

export function ProvaPage() {
  const { atividadeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [atividade, setAtividade] = useState(null);
  const [turma, setTurma] = useState(null);
  const [dataAtividade, setDataAtividade] = useState(null);
  const [horarioAtividade, setHorarioAtividade] = useState(null);
  // Estado para armazenar as notas dos alunos: { alunoId: { notaId, valor } }
  const [notas, setNotas] = useState({});
  // Estado para armazenar valores temporários dos inputs: { alunoId: valor }
  const [notasInput, setNotasInput] = useState({});
  // Estado para controlar quais alunos já tiveram a nota salva: { alunoId: true/false }
  const [notasSalvas, setNotasSalvas] = useState({});
  // Estado para controlar se as presenças foram marcadas
  const [presencasMarcadas, setPresencasMarcadas] = useState(false);

  // Função auxiliar para normalizar IDs para comparação
  const normalizarId = (id) => {
    if (!id) return null;
    if (typeof id === 'string') return id;
    if (typeof id === 'object' && id !== null) {
      // Se é um objeto, tentar pegar o _id primeiro
      // Se o objeto tem _id, usar ele, senão tentar usar o próprio objeto como string
      const idValue = id._id?.toString() || id._id;
      if (idValue) return idValue;
      // Se não tem _id, pode ser que seja um ObjectId direto
      return id.toString();
    }
    return id?.toString() || String(id);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!atividadeId) {
        navigate("/aulas");
        return;
      }

      setIsLoading(true);
      try {
        const atividadeResult = await atividadeService.getById(atividadeId);

        if (atividadeResult.success) {
          const atividadeData = atividadeResult.data;
          setAtividade(atividadeData);

          // Extrair turmaId da atividade
          let turmaId = null;
          
          if (atividadeData.turmaId) {
            if (typeof atividadeData.turmaId === 'object' && atividadeData.turmaId !== null) {
              turmaId = atividadeData.turmaId._id || atividadeData.turmaId;
              
              // Verificar se a turma já vem populada com alunos válidos
              if (atividadeData.turmaId.alunos && Array.isArray(atividadeData.turmaId.alunos) && atividadeData.turmaId.alunos.length > 0) {
                setTurma(atividadeData.turmaId);
              }
            } else {
              turmaId = atividadeData.turmaId;
            }
          }

          // Sempre buscar turma separadamente para garantir que temos os alunos populados corretamente
          if (turmaId) {
            try {
              const turmaResult = await turmaService.getById(turmaId);
              if (turmaResult.success && turmaResult.data) {
                setTurma(turmaResult.data);
                
                // Buscar notas dos alunos para esta atividade
                const notasResult = await notaAtividadeService.getAll({
                  atividadeId: atividadeId,
                });
                
                const notasMap = {};
                const notasInputMap = {};
                const notasSalvasMap = {};
                
                if (notasResult.success && notasResult.data && Array.isArray(notasResult.data)) {
                  notasResult.data.forEach((nota) => {
                    // Extrair alunoId da nota usando função auxiliar
                    const alunoIdNota = normalizarId(nota.alunoId);
                    
                    if (alunoIdNota) {
                      notasMap[alunoIdNota] = {
                        notaId: nota._id?.toString() || nota._id,
                        valor: nota.valor,
                      };
                      // Inicializar com valor da nota ou string vazia
                      notasInputMap[alunoIdNota] = nota.valor !== null && nota.valor !== undefined ? nota.valor.toString() : "";
                      
                      // Marcar como salva se já tem valor
                      if (nota.valor !== null && nota.valor !== undefined) {
                        notasSalvasMap[alunoIdNota] = true;
                      }
                    }
                  });
                }
                
                // Garantir que todos os alunos tenham entrada no mapa de notas (mesmo que não existam ainda)
                if (turmaResult.data && turmaResult.data.alunos && notasResult.success && notasResult.data) {
                  turmaResult.data.alunos.forEach((aluno) => {
                    // Normalizar alunoId - pode ser um objeto com _id ou o próprio _id
                    const alunoId = normalizarId(typeof aluno === 'object' && aluno !== null ? (aluno._id || aluno) : aluno);
                    
                    if (alunoId) {
                      // Se não tem nota ainda, tentar encontrar novamente comparando todos os IDs possíveis
                      if (!notasMap[alunoId]) {
                        // Buscar na lista de notas retornadas usando função auxiliar
                        const notaEncontrada = Array.isArray(notasResult.data) ? notasResult.data.find((nota) => {
                          const notaAlunoId = normalizarId(nota.alunoId);
                          // Comparar como strings para garantir match
                          return notaAlunoId && notaAlunoId === alunoId;
                        }) : null;
                        
                        if (notaEncontrada) {
                          notasMap[alunoId] = {
                            notaId: notaEncontrada._id?.toString() || notaEncontrada._id,
                            valor: notaEncontrada.valor,
                          };
                          notasInputMap[alunoId] = notaEncontrada.valor !== null && notaEncontrada.valor !== undefined 
                            ? notaEncontrada.valor.toString() 
                            : "";
                          if (notaEncontrada.valor !== null && notaEncontrada.valor !== undefined) {
                            notasSalvasMap[alunoId] = true;
                          }
                        } else {
                          // Se ainda não encontrou, inicializar com entrada vazia
                          notasMap[alunoId] = {
                            notaId: null,
                            valor: null,
                          };
                        }
                      }
                      // Se não tem input ainda, inicializar vazio
                      if (notasInputMap[alunoId] === undefined) {
                        notasInputMap[alunoId] = "";
                      }
                    }
                  });
                }
                
                setNotas(notasMap);
                setNotasInput(notasInputMap);
                setNotasSalvas(notasSalvasMap);

                // Verificar se as presenças foram marcadas
                if (atividadeData.data && turmaId && atividadeData.materiaId) {
                  try {
                    const dataObj = new Date(atividadeData.data);
                    if (!isNaN(dataObj.getTime())) {
                      // Obter dia da semana (0 = domingo, 1 = segunda, etc.)
                      const diaSemanaJS = dataObj.getDay();
                      // Converter para o formato do sistema: 1 = segunda, 2 = terça, ..., 7 = domingo
                      const diaSemanaSistema = diaSemanaJS === 0 ? 7 : diaSemanaJS;

                      // Buscar aula semanal correspondente
                      const aulasResult = await aulaSemanalService.getAll();
                      if (aulasResult.success && aulasResult.data) {
                        const aulaSemanal = aulasResult.data.find((aula) => {
                          const aulaTurmaId = normalizarId(aula.turmaId?._id || aula.turmaId);
                          const aulaMateriaId = normalizarId(aula.materiaId?._id || aula.materiaId);
                          const atividadeTurmaId = normalizarId(turmaId);
                          const atividadeMateriaId = normalizarId(atividadeData.materiaId?._id || atividadeData.materiaId);
                          
                          return (
                            aula.diaSemana === diaSemanaSistema &&
                            aulaTurmaId === atividadeTurmaId &&
                            aulaMateriaId === atividadeMateriaId &&
                            aula.status === "ativa"
                          );
                        });

                        if (aulaSemanal) {
                          // Buscar presenças daquela aula naquela data
                          const dataStr = dataObj.toISOString().split('T')[0];
                          const dataInicio = `${dataStr}T00:00:00`;
                          const dataFim = `${dataStr}T23:59:59`;
                          
                          const presencasResult = await attendanceService.getAll({
                            turmaId: turmaId,
                            materiaId: atividadeData.materiaId?._id || atividadeData.materiaId,
                            dataInicio,
                            dataFim,
                          });

                          if (presencasResult.success && presencasResult.data) {
                            const alunosIds = turmaResult.data.alunos.map((aluno) => {
                              return normalizarId(typeof aluno === 'object' && aluno !== null ? (aluno._id || aluno) : aluno);
                            }).filter(id => id);

                            const presencasMarcadasIds = presencasResult.data.map((presenca) => {
                              return normalizarId(presenca.alunoId?._id || presenca.alunoId);
                            }).filter(id => id);

                            // Verificar se todos os alunos têm presença marcada
                            const todasPresencasMarcadas = alunosIds.every((alunoId) => {
                              return presencasMarcadasIds.includes(alunoId);
                            });

                            setPresencasMarcadas(todasPresencasMarcadas);
                          } else {
                            setPresencasMarcadas(false);
                          }
                        } else {
                          // Se não encontrou aula semanal, não bloquear (pode ser atividade sem aula)
                          setPresencasMarcadas(true);
                        }
                      }
                    }
                  } catch (error) {
                    console.error("Erro ao verificar presenças:", error);
                    // Em caso de erro, não bloquear
                    setPresencasMarcadas(true);
                  }
                } else {
                  // Se não tem dados suficientes, não bloquear
                  setPresencasMarcadas(true);
                }
              }
            } catch (error) {
              console.error("Erro ao buscar turma:", error);
            }
          }

          // Obter data da atividade
          if (atividadeData.data) {
            try {
              const dataObj = new Date(atividadeData.data);
              if (!isNaN(dataObj.getTime())) {
                setDataAtividade(dataObj);
              }
            } catch (error) {
              console.error("Erro ao parsear data:", error);
            }
          }

          // Obter horário da atividade
          if (atividadeData.horarioInicio && atividadeData.horarioFim) {
            setHorarioAtividade(`${atividadeData.horarioInicio}-${atividadeData.horarioFim}`);
          }
        } else {
          console.error("Erro ao buscar atividade:", atividadeResult.error);
        }
      } catch (error) {
        console.error("Erro ao carregar dados da prova:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [atividadeId, navigate]);

  // Função para formatar data no formato dia/mês/ano
  const formatarData = (data) => {
    if (!data) return "";
    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  // Função para formatar data no formato YYYY-MM-DD para navegação
  const formatarDataParaNavegacao = (data) => {
    if (!data) return null;
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
  };

  const handleVoltar = () => {
    if (dataAtividade) {
      const dataFormatada = formatarDataParaNavegacao(dataAtividade);
      if (dataFormatada) {
        navigate(`/aulas/dia/${dataFormatada}`);
      } else {
        navigate("/aulas");
      }
    } else {
      navigate("/aulas");
    }
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

  // Função para atualizar valor do input de nota
  const handleNotaChange = (alunoId, valor) => {
    // Se o campo estiver vazio, permitir (para poder limpar)
    if (valor === "") {
      setNotasInput((prev) => ({
        ...prev,
        [alunoId]: "",
      }));
      return;
    }

    // Converter para número
    const numero = parseFloat(valor);
    
    // Se não for um número válido, não atualizar
    if (isNaN(numero)) {
      return;
    }

    // Validar range: 0.0 a 10.0
    if (numero < 0) {
      setNotasInput((prev) => ({
        ...prev,
        [alunoId]: "0",
      }));
      return;
    }

    if (numero > 10) {
      setNotasInput((prev) => ({
        ...prev,
        [alunoId]: "10",
      }));
      return;
    }

    // Atualizar com o valor válido
    setNotasInput((prev) => ({
      ...prev,
      [alunoId]: valor,
    }));
  };

  // Função para salvar nota
  const handleSalvarNota = async (alunoId) => {
    const notaInfo = notas[alunoId];
    const valorInput = notasInput[alunoId];
    
    // Validar valor (0-10)
    if (!valorInput || valorInput === "") {
      showErrorToast("Digite uma nota antes de salvar");
      return;
    }

    const valor = parseFloat(valorInput);
    if (isNaN(valor) || valor < 0 || valor > 10) {
      showErrorToast("Nota deve ser um número entre 0 e 10");
      return;
    }

    // Normalizar alunoId usando função auxiliar
    const alunoIdStr = normalizarId(alunoId);
    
    // Buscar notaId - pode estar no estado ou precisar buscar novamente
    let notaIdParaSalvar = notaInfo?.notaId;
    
    // Se não tem notaId no estado, buscar todas as notas da atividade e encontrar a do aluno
    if (!notaIdParaSalvar) {
      try {
        // Primeiro, tentar buscar novamente todas as notas
        const notasResult = await notaAtividadeService.getAll({
          atividadeId: atividadeId,
        });
        
        if (notasResult.success && notasResult.data && Array.isArray(notasResult.data)) {
          // Encontrar a nota deste aluno específico - tentar múltiplas formas de comparação
          let notaEncontrada = null;
          
          for (const nota of notasResult.data) {
            // Usar função auxiliar para normalizar IDs
            const notaAlunoId = normalizarId(nota.alunoId);
            
            // Comparar como strings para garantir match
            if (notaAlunoId && notaAlunoId === alunoIdStr) {
              notaEncontrada = nota;
              break;
            }
          }
          
          if (notaEncontrada) {
            notaIdParaSalvar = notaEncontrada._id?.toString() || notaEncontrada._id;
            
            // Atualizar estado local com o notaId encontrado
            setNotas((prev) => ({
              ...prev,
              [alunoIdStr]: {
                notaId: notaIdParaSalvar,
                valor: notaEncontrada.valor,
              },
            }));
          } else {
            // Se ainda não encontrou, mostrar erro mais detalhado
            showErrorToast(`Nota não encontrada para este aluno. Total de notas encontradas: ${notasResult.data.length}`);
            return;
          }
        } else {
          showErrorToast("Erro ao buscar notas da atividade ou nenhuma nota encontrada");
          return;
        }
      } catch (error) {
        console.error("Erro ao buscar nota:", error);
        showErrorToast("Erro ao buscar nota do aluno: " + (error.message || "Erro desconhecido"));
        return;
      }
    }

    if (!notaIdParaSalvar) {
      showErrorToast("Não foi possível encontrar a nota para este aluno");
      return;
    }

    try {
      const result = await notaAtividadeService.adicionarNota(notaIdParaSalvar, valor);
      
      if (result.success) {
        // Atualizar estado local usando alunoIdStr para garantir consistência
        setNotas((prev) => ({
          ...prev,
          [alunoIdStr]: {
            notaId: notaIdParaSalvar,
            valor: valor,
          },
        }));
        
        // Atualizar também o input com o valor salvo usando alunoIdStr
        setNotasInput((prev) => ({
          ...prev,
          [alunoIdStr]: valor.toString(),
        }));
        
        // Marcar nota como salva para esconder campo e botão usando alunoIdStr
        setNotasSalvas((prev) => ({
          ...prev,
          [alunoIdStr]: true,
        }));
        
        showSuccessToast("✅ Nota salva com sucesso");
      } else {
        const errorMessage = result.error?.message || result.error || "Erro ao salvar nota";
        showErrorToast(errorMessage);
      }
    } catch (error) {
      const errorMessage = error?.message || "Erro ao salvar nota";
      showErrorToast(errorMessage);
      console.error("Erro ao salvar nota:", error);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Usar o nome da atividade, ou tipo se não houver nome
  const titulo = atividade?.nome || (atividade?.tipo === "prova" ? "Prova" : atividade?.tipo === "trabalho" ? "Trabalho" : "Atividade");

  const dataFormatada = dataAtividade ? formatarData(dataAtividade) : "";
  const horarioFormatado = horarioAtividade ? formatarHorario(horarioAtividade) : "";

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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Alunos da Turma</h3>
            {!presencasMarcadas && (
              <div className="text-sm text-orange-600 font-medium bg-orange-50 px-3 py-1 rounded border border-orange-200">
                ⚠️ Marque as presenças da aula primeiro
              </div>
            )}
          </div>
          
          {turma && turma.alunos && Array.isArray(turma.alunos) && turma.alunos.length > 0 ? (
            <div className="space-y-3">
              {turma.alunos.map((aluno) => {
                const alunoObj = typeof aluno === 'object' && aluno !== null ? aluno : null;
                if (!alunoObj) return null;
                
                const userId = alunoObj?.userId;
                const alunoNome = userId?.name || "Aluno";
                const alunoEmail = userId?.email || "";
                const alunoFotoPerfil = userId?.fotoPerfil || null;
                // Normalizar alunoId usando função auxiliar
                const alunoId = normalizarId(alunoObj?._id || alunoObj || aluno);
                const alunoIdStr = alunoId;
                
                const notaInfo = notas[alunoIdStr] || notas[alunoId];
                // Obter valor da nota (prioridade: input > estado > null)
                let valorNota = "";
                if (notasInput[alunoIdStr] !== undefined && notasInput[alunoIdStr] !== "") {
                  valorNota = notasInput[alunoIdStr];
                } else if (notasInput[alunoId] !== undefined && notasInput[alunoId] !== "") {
                  valorNota = notasInput[alunoId];
                } else if (notaInfo?.valor !== null && notaInfo?.valor !== undefined) {
                  valorNota = notaInfo.valor.toString();
                }
                
                const notaSalva = notasSalvas[alunoIdStr] || notasSalvas[alunoId];
                // Obter valor final da nota para exibição (prioridade: estado > input convertido)
                const notaFinal = notaInfo?.valor !== null && notaInfo?.valor !== undefined 
                  ? notaInfo.valor 
                  : (valorNota && !isNaN(parseFloat(valorNota)) ? parseFloat(valorNota) : null);
                
                return (
                  <div
                    key={alunoId}
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
                    
                    {/* Campo de Nota e Botão Check ou Nota Salva */}
                    <div className="flex items-center gap-2 shrink-0">
                      {notaSalva && notaFinal !== null ? (
                        <span className="text-lg font-bold text-gray-800">
                          {notaFinal.toFixed(1)}
                        </span>
                      ) : (
                        <>
                          <input
                            type="number"
                            min="0"
                            max="10"
                            step="0.1"
                            value={valorNota}
                            onChange={(e) => handleNotaChange(alunoIdStr || alunoId, e.target.value)}
                            onBlur={(e) => {
                              // Garantir que o valor está no range ao perder o foco
                              const valor = parseFloat(e.target.value);
                              if (!isNaN(valor)) {
                                if (valor < 0) {
                                  handleNotaChange(alunoIdStr || alunoId, "0");
                                } else if (valor > 10) {
                                  handleNotaChange(alunoIdStr || alunoId, "10");
                                }
                              }
                            }}
                            placeholder="0.0"
                            disabled={!presencasMarcadas}
                            className={`w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                              !presencasMarcadas ? "bg-gray-100 cursor-not-allowed opacity-60" : ""
                            }`}
                            title={!presencasMarcadas ? "Marque as presenças da aula primeiro" : ""}
                          />
                          <button
                            type="button"
                            onClick={() => handleSalvarNota(alunoIdStr || alunoId)}
                            disabled={!presencasMarcadas}
                            className={`w-10 h-10 rounded-full transition-colors flex items-center justify-center ${
                              presencasMarcadas
                                ? "bg-green-500 text-white hover:bg-green-600"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}
                            title={!presencasMarcadas ? "Marque as presenças da aula primeiro" : "Salvar nota"}
                          >
                            <FiCheck size={20} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">
              {turma ? "Nenhum aluno encontrado nesta turma." : "Carregando alunos..."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
