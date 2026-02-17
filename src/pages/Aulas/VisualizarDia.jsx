import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiTrash2 } from "react-icons/fi";
import { PageHeader } from "../../components/ui/PageHeader";
import aulaSemanalService from "../../services/aulaSemanal.service";
import atividadeService from "../../services/atividade.service";
import attendanceService from "../../services/attendance.service";
import notaAtividadeService from "../../services/notaAtividade.service";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import { showErrorToast, showSuccessToast, showConfirmDeleteToast } from "../../components/feedback/toastConfig";
import { useAuth } from "../../context/AuthContext";

// Função para formatar data em português
const formatarData = (data) => {
  const diasSemana = [
    "domingo",
    "segunda-feira",
    "terça-feira",
    "quarta-feira",
    "quinta-feira",
    "sexta-feira",
    "sábado",
  ];

  const meses = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];

  const dia = data.getDate();
  const diaSemana = diasSemana[data.getDay()];
  const mes = meses[data.getMonth()];
  const ano = data.getFullYear();

  return {
    dia,
    diaSemana,
    mes,
    ano,
    dataCompleta: `${dia} de ${mes} de ${ano}`,
  };
};

// Função para converter horário HH:MM para minutos
const horarioParaMinutos = (horario) => {
  const [hora, minuto] = horario.split(":").map(Number);
  return hora * 60 + minuto;
};

// Função para obter o dia da semana (0 = domingo, 1 = segunda, etc.)
const obterDiaSemana = (data) => {
  return data.getDay();
};

// Função para verificar se uma data está dentro do semestre
const isDateInSemester = (date, semestre) => {
  const month = date.getMonth() + 1; // getMonth() retorna 0-11, então adicionamos 1
  
  if (semestre === "1") {
    // 1º Semestre: fevereiro (2) até junho (6)
    return month >= 2 && month <= 6;
  } else if (semestre === "2") {
    // 2º Semestre: agosto (8) até novembro (11)
    return month >= 8 && month <= 11;
  }
  
  return false;
};

// Função para gerar horários do dia (de 00:00 até 23:00)
const gerarHorarios = () => {
  const horarios = [];
  for (let hora = 0; hora < 24; hora++) {
    horarios.push({
      hora,
      label: `${hora.toString().padStart(2, "0")}:00`,
    });
  }
  return horarios;
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

export function VisualizarDia() {
  const { data } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [aulasSemanais, setAulasSemanais] = useState([]);
  const [atividades, setAtividades] = useState([]);
  const [aulasDoDia, setAulasDoDia] = useState([]);
  const [atividadesDoDia, setAtividadesDoDia] = useState([]);
  const [dataSelecionada, setDataSelecionada] = useState(null);
  const [presencas, setPresencas] = useState([]); // Array de presenças do aluno
  const [notasAtividades, setNotasAtividades] = useState([]); // Array de notas das atividades do aluno

  useEffect(() => {
    const carregarDados = async () => {
      if (!data) {
        showErrorToast("Data não fornecida");
        navigate("/aulas");
        return;
      }

      setIsLoading(true);

      try {
        // Parsear a data (formato esperado: YYYY-MM-DD)
        const dataObj = new Date(data + "T12:00:00"); // Usar meio-dia para evitar problemas de timezone
        if (isNaN(dataObj.getTime())) {
          showErrorToast("Data inválida");
          navigate("/aulas");
          return;
        }

        setDataSelecionada(dataObj);

        // Obter o dia da semana (0 = domingo, 1 = segunda, etc.)
        const diaSemanaJS = obterDiaSemana(dataObj);
        // Converter para o formato do sistema: 1 = segunda, 2 = terça, ..., 7 = domingo
        // JS: 0=domingo, 1=segunda, ..., 6=sábado
        // Sistema: 1=segunda, 2=terça, ..., 7=domingo
        const diaSemanaSistema = diaSemanaJS === 0 ? 7 : diaSemanaJS;

        // Buscar aulas semanais, atividades e presenças (se for aluno)
        const promises = [
          aulaSemanalService.getAll(),
          atividadeService.getAll(),
        ];
        
        // Se for aluno, buscar presenças para aquela data
        if (user?.role === "aluno") {
          const dataStr = data; // YYYY-MM-DD
          // Usar início e fim do dia para garantir que capture todas as presenças do dia
          const dataInicio = `${dataStr}T00:00:00`;
          const dataFim = `${dataStr}T23:59:59`;
          promises.push(attendanceService.getAll({ dataInicio, dataFim }));
        }
        
        const results = await Promise.all(promises);
        const aulasResult = results[0];
        const atividadesResult = results[1];
        const presencasResult = user?.role === "aluno" ? results[2] : null;
        
        // Se for aluno, buscar notas das atividades após filtrar as atividades do dia
        if (user?.role === "aluno" && atividadesResult.success) {
          const todasAtividades = atividadesResult.data || [];
          const dataStr = data; // YYYY-MM-DD
          const atividadesFiltradas = todasAtividades.filter((atividade) => {
            if (!atividade.data) return false;
            const atividadeData = new Date(atividade.data);
            const atividadeDataStr = atividadeData.toISOString().split("T")[0];
            return atividadeDataStr === dataStr;
          });
          
          // Buscar notas para todas as atividades do dia
          // O backend já filtra automaticamente por aluno quando role é "aluno"
          if (atividadesFiltradas.length > 0) {
            const atividadeIds = atividadesFiltradas.map(a => a._id);
            // Buscar todas as notas do aluno (o backend já filtra por aluno automaticamente)
            const notasResult = await notaAtividadeService.getAll({});
            if (notasResult.success && notasResult.data && Array.isArray(notasResult.data)) {
              // Filtrar apenas as notas das atividades do dia
              const notasFiltradas = notasResult.data.filter(nota => {
                if (!nota.atividadeId) return false;
                const notaAtividadeId = typeof nota.atividadeId === 'object' && nota.atividadeId !== null
                  ? (nota.atividadeId._id?.toString() || nota.atividadeId.toString())
                  : nota.atividadeId.toString();
                return atividadeIds.some(id => {
                  const atividadeIdStr = typeof id === 'object' && id !== null
                    ? (id._id?.toString() || id.toString())
                    : id.toString();
                  return notaAtividadeId === atividadeIdStr;
                });
              });
              setNotasAtividades(notasFiltradas);
            } else {
              setNotasAtividades([]);
            }
          } else {
            setNotasAtividades([]);
          }
        }

        if (aulasResult.success) {
          const todasAulas = aulasResult.data || [];
          
          // Filtrar aulas que ocorrem neste dia da semana, estão ativas e estão no semestre correto
          const aulasFiltradas = todasAulas.filter((aula) => {
            if (aula.status !== "ativa" || aula.diaSemana !== diaSemanaSistema) {
              return false;
            }
            
            // Verificar se a data está no semestre da aula
            if (aula.semestre && !isDateInSemester(dataObj, aula.semestre)) {
              return false;
            }
            
            return true;
          });

          setAulasSemanais(todasAulas);
          setAulasDoDia(aulasFiltradas);
        }

        if (atividadesResult.success) {
          const todasAtividades = atividadesResult.data || [];
          
          // Filtrar atividades que ocorrem nesta data específica
          const dataStr = data; // YYYY-MM-DD
          const atividadesFiltradas = todasAtividades.filter((atividade) => {
            if (!atividade.data) return false;
            const atividadeData = new Date(atividade.data);
            const atividadeDataStr = atividadeData.toISOString().split("T")[0];
            return atividadeDataStr === dataStr;
          });

          setAtividades(todasAtividades);
          setAtividadesDoDia(atividadesFiltradas);
        }

        // Se for aluno, processar presenças
        if (user?.role === "aluno" && presencasResult?.success) {
          setPresencas(presencasResult.data || []);
        }
      } catch (error) {
        showErrorToast("Erro ao carregar dados do dia");
        navigate("/aulas");
      } finally {
        setIsLoading(false);
      }
    };

    carregarDados();
  }, [data, navigate, user]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!dataSelecionada) {
    return null;
  }

  const { dia, diaSemana, mes, ano, dataCompleta } = formatarData(dataSelecionada);
  const horarios = gerarHorarios();

  // Função para deletar aula
  const handleDeleteAula = (evento) => {
    if (evento.tipo !== "aula") return;

    const mensagem = `🗑️ Deseja deletar as aulas ${evento.materiaNome} da ${evento.turmaNome}?`;
    
    showConfirmDeleteToast(
      mensagem,
      async () => {
        try {
          const result = await aulaSemanalService.delete(evento.id);
          if (result.success) {
            showSuccessToast("✅ Aula deletada com sucesso");
            // Recarregar os dados do dia
            const [aulasResult] = await Promise.all([
              aulaSemanalService.getAll(),
            ]);

            if (aulasResult.success) {
              const todasAulas = aulasResult.data || [];
              const diaSemanaJS = obterDiaSemana(dataSelecionada);
              const diaSemanaSistema = diaSemanaJS === 0 ? 7 : diaSemanaJS;
              
              const aulasFiltradas = todasAulas.filter((aula) => {
                if (aula.status !== "ativa" || aula.diaSemana !== diaSemanaSistema) {
                  return false;
                }
                
                // Verificar se a data está no semestre da aula
                if (aula.semestre && !isDateInSemester(dataSelecionada, aula.semestre)) {
                  return false;
                }
                
                return true;
              });

              setAulasSemanais(todasAulas);
              setAulasDoDia(aulasFiltradas);
            }
          } else {
            showErrorToast(result.error || "Erro ao deletar aula");
          }
        } catch (error) {
          showErrorToast("Erro ao deletar aula. Tente novamente.");
        }
      },
      () => {
        // Cancelar - não fazer nada
      }
    );
  };

  // Função para deletar atividade (prova ou trabalho)
  const handleDeleteAtividade = (evento) => {
    if (evento.tipo !== "prova" && evento.tipo !== "trabalho") return;

    const tipoTexto = evento.tipo === "prova" ? "prova" : "trabalho";
    const mensagem = `🗑️ Deseja deletar a ${tipoTexto} ${evento.titulo}?`;
    
    showConfirmDeleteToast(
      mensagem,
      async () => {
        try {
          const result = await atividadeService.delete(evento.id);
          if (result.success) {
            showSuccessToast(`✅ ${tipoTexto.charAt(0).toUpperCase() + tipoTexto.slice(1)} deletada com sucesso`);
            // Recarregar os dados do dia
            const [atividadesResult] = await Promise.all([
              atividadeService.getAll(),
            ]);

            if (atividadesResult.success) {
              const todasAtividades = atividadesResult.data || [];
              const dataStr = data; // YYYY-MM-DD
              
              const atividadesFiltradas = todasAtividades.filter((atividade) => {
                if (!atividade.data) return false;
                const atividadeData = new Date(atividade.data);
                const atividadeDataStr = atividadeData.toISOString().split("T")[0];
                return atividadeDataStr === dataStr;
              });

              setAtividades(todasAtividades);
              setAtividadesDoDia(atividadesFiltradas);
            }
          } else {
            showErrorToast(result.error || `Erro ao deletar ${tipoTexto}`);
          }
        } catch (error) {
          showErrorToast(`Erro ao deletar ${tipoTexto}. Tente novamente.`);
        }
      },
      () => {
        // Cancelar - não fazer nada
      }
    );
  };

  // Função para buscar status de presença de uma aula
  const getPresencaStatus = (turmaId, materiaId) => {
    if (user?.role !== "aluno" || !presencas || presencas.length === 0) {
      return null; // Não é aluno ou não há presenças
    }
    
    if (!turmaId || !materiaId) {
      return null;
    }
    
    // Normalizar IDs para string
    const turmaIdStr = typeof turmaId === 'object' && turmaId !== null 
      ? (turmaId._id?.toString() || turmaId.toString())
      : turmaId?.toString();
    const materiaIdStr = typeof materiaId === 'object' && materiaId !== null
      ? (materiaId._id?.toString() || materiaId.toString())
      : materiaId?.toString();
    
    if (!turmaIdStr || !materiaIdStr) {
      return null;
    }
    
    const presenca = presencas.find((p) => {
      if (!p.turmaId || !p.materiaId) return false;
      
      const pTurmaId = typeof p.turmaId === 'object' && p.turmaId !== null
        ? (p.turmaId._id?.toString() || p.turmaId.toString())
        : p.turmaId?.toString();
      const pMateriaId = typeof p.materiaId === 'object' && p.materiaId !== null
        ? (p.materiaId._id?.toString() || p.materiaId.toString())
        : p.materiaId?.toString();
      
      return pTurmaId === turmaIdStr && pMateriaId === materiaIdStr;
    });
    
    if (!presenca) {
      return null; // Não há registro de presença ainda
    }
    
    return presenca.presente ? "Presente" : "Faltou";
  };

  // Função para buscar nota de uma atividade
  const getNotaAtividade = (atividadeId) => {
    if (user?.role !== "aluno" || !notasAtividades || notasAtividades.length === 0) {
      return null; // Não é aluno ou não há notas
    }
    
    if (!atividadeId) {
      return null;
    }
    
    // Normalizar ID da atividade
    const atividadeIdStr = typeof atividadeId === 'object' && atividadeId !== null
      ? (atividadeId._id?.toString() || atividadeId.toString())
      : atividadeId?.toString();
    
    if (!atividadeIdStr) {
      return null;
    }
    
    const nota = notasAtividades.find((n) => {
      if (!n.atividadeId) return false;
      
      const nAtividadeId = typeof n.atividadeId === 'object' && n.atividadeId !== null
        ? (n.atividadeId._id?.toString() || n.atividadeId.toString())
        : n.atividadeId?.toString();
      
      return nAtividadeId === atividadeIdStr;
    });
    
    if (!nota || nota.valor === null || nota.valor === undefined) {
      return null; // Não há nota ainda ou nota está vazia
    }
    
    return nota.valor;
  };

  // Combinar aulas e atividades e ordenar por horário
  const eventosDoDia = [
    ...aulasDoDia.map((aula) => {
      // Extrair IDs corretamente (pode ser objeto populado ou string)
      const turmaIdObj = typeof aula.turmaId === 'object' && aula.turmaId !== null ? aula.turmaId : null;
      const materiaIdObj = typeof aula.materiaId === 'object' && aula.materiaId !== null ? aula.materiaId : null;
      
      const turmaId = turmaIdObj?._id || turmaIdObj || aula.turmaId;
      const materiaId = materiaIdObj?._id || materiaIdObj || aula.materiaId;
      
      const statusPresenca = getPresencaStatus(turmaId, materiaId);
      
      return {
        tipo: "aula",
        id: aula._id,
        titulo: `${aula.materiaId?.nome || "Matéria"} - ${aula.turmaId?.nome || "Turma"}`,
        horarioInicio: aula.horarioInicio,
        horarioFim: aula.horarioFim,
        inicioMinutos: horarioParaMinutos(aula.horarioInicio),
        fimMinutos: horarioParaMinutos(aula.horarioFim),
        turmaNome: typeof aula.turmaId === 'object' ? aula.turmaId?.nome : "Turma",
        nivelEducacional: typeof aula.turmaId === 'object' ? aula.turmaId?.nivelEducacional : null,
        materiaNome: aula.materiaId?.nome || "Matéria",
        professorNome: aula.professorId?.userId?.name || "Professor",
        turmaId: turmaId,
        materiaId: materiaId,
        statusPresenca: statusPresenca, // "Presente", "Faltou" ou null
      };
    }),
    ...atividadesDoDia.map((atividade) => {
      const notaAtividade = getNotaAtividade(atividade._id);
      return {
        tipo: atividade.tipo || "atividade",
        id: atividade._id,
        titulo: atividade.nome || "Atividade",
        horarioInicio: atividade.horarioInicio || null,
        horarioFim: atividade.horarioFim || null,
        inicioMinutos: atividade.horarioInicio
          ? horarioParaMinutos(atividade.horarioInicio)
          : 0,
        fimMinutos: atividade.horarioFim
          ? horarioParaMinutos(atividade.horarioFim)
          : 0,
        turmaNome: typeof atividade.turmaId === 'object' ? atividade.turmaId?.nome : "Turma",
        nivelEducacional: typeof atividade.turmaId === 'object' ? atividade.turmaId?.nivelEducacional : null,
        materiaNome: typeof atividade.materiaId === 'object' ? atividade.materiaId?.nome : "Matéria",
        nota: notaAtividade, // Nota do aluno para esta atividade
      };
    }),
  ].sort((a, b) => a.inicioMinutos - b.inicioMinutos);

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <PageHeader title="Visualizar Dia" />

      {/* Header com data */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {dataCompleta}
          </h1>
          <p className="text-lg sm:text-xl font-semibold text-gray-600 capitalize">
            {diaSemana}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="relative">
          {/* Horários e eventos */}
          {horarios.map((horario, index) => {
            const horaMinutos = horario.hora * 60;
            const proximaHoraMinutos = (horario.hora + 1) * 60;

            // Encontrar eventos que começam nesta hora
            const eventosQueComecamNestaHora = eventosDoDia.filter((evento) => {
              return (
                evento.inicioMinutos >= horaMinutos &&
                evento.inicioMinutos < proximaHoraMinutos
              );
            });

            return (
              <div
                key={horario.hora}
                className="flex border-b border-gray-200 last:border-b-0 min-h-[60px] sm:min-h-[80px]"
              >
                {/* Label do horário */}
                <div className="w-16 sm:w-20 shrink-0 flex items-start pt-2 px-2 sm:px-3">
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">
                    {horario.label}
                  </span>
                </div>

                {/* Área de eventos */}
                <div className="flex-1 relative py-1 sm:py-2 px-2 sm:px-3">
                  {eventosQueComecamNestaHora.length > 0 ? (
                    <div className="space-y-1 sm:space-y-2">
                      {eventosQueComecamNestaHora.map((evento) => {
                        // Calcular altura baseada na duração (em minutos)
                        const duracaoMinutos = evento.fimMinutos - evento.inicioMinutos;
                        // Altura mínima de 40px, depois proporcional (1 minuto = 1px)
                        const alturaPixels = Math.max(40, duracaoMinutos);
                        // Offset dentro da hora (se começar depois do início da hora)
                        const offsetNaHora = evento.inicioMinutos - horaMinutos;

                        // Função para navegar para página da aula (apenas para professor)
                        const handleAulaClick = () => {
                          if (evento.tipo === "aula" && user?.role === "professor" && evento.materiaId && evento.turmaId) {
                            const materiaIdStr = typeof evento.materiaId === 'object' 
                              ? evento.materiaId._id?.toString() || evento.materiaId.toString()
                              : evento.materiaId.toString();
                            const turmaIdStr = typeof evento.turmaId === 'object'
                              ? evento.turmaId._id?.toString() || evento.turmaId.toString()
                              : evento.turmaId.toString();
                            // Passar a data e horário como query params
                            const dataStr = data; // YYYY-MM-DD
                            const horarioStr = evento.horarioInicio && evento.horarioFim 
                              ? `${evento.horarioInicio}-${evento.horarioFim}`
                              : '';
                            navigate(`/aulas/${materiaIdStr}/${turmaIdStr}?data=${dataStr}${horarioStr ? `&horario=${horarioStr}` : ''}`);
                          }
                        };

                        // Função para navegar para página da prova/trabalho (apenas para professor)
                        const handleAtividadeClick = () => {
                          if ((evento.tipo === "prova" || evento.tipo === "trabalho") && user?.role === "professor" && evento.id) {
                            navigate(`/atividades/${evento.id}`);
                          }
                        };

                        return (
                          <div
                            key={`${evento.tipo}-${evento.id}`}
                            className={`rounded-lg p-2 sm:p-3 text-xs sm:text-sm shadow-sm relative flex flex-col border-2 ${
                              evento.tipo === "aula"
                                ? "border-orange-500 bg-white text-orange-600"
                                : evento.tipo === "prova"
                                ? "border-red-500 bg-white text-red-600"
                                : evento.tipo === "trabalho"
                                ? "border-blue-500 bg-white text-blue-600"
                                : "border-gray-500 bg-white text-gray-600"
                            } ${
                              (evento.tipo === "aula" && user?.role === "professor") ||
                              ((evento.tipo === "prova" || evento.tipo === "trabalho") && user?.role === "professor")
                                ? evento.tipo === "aula"
                                  ? "cursor-pointer hover:bg-orange-50 transition-colors"
                                  : evento.tipo === "prova"
                                  ? "cursor-pointer hover:bg-red-50 transition-colors"
                                  : "cursor-pointer hover:bg-blue-50 transition-colors"
                                : ""
                            }`}
                            style={{
                              marginTop: `${offsetNaHora}px`,
                              minHeight: `${alturaPixels}px`,
                            }}
                            onClick={
                              evento.tipo === "aula" && user?.role === "professor"
                                ? handleAulaClick
                                : (evento.tipo === "prova" || evento.tipo === "trabalho") && user?.role === "professor"
                                ? handleAtividadeClick
                                : undefined
                            }
                          >
                            {/* Ícone de lixeira - apenas para aulas e apenas para admin */}
                            {evento.tipo === "aula" && user?.role === "admin" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAula(evento);
                                }}
                                className={`absolute top-2 right-2 transition-colors z-10 ${
                                  evento.tipo === "aula"
                                    ? "text-orange-600 hover:text-red-600"
                                    : ""
                                }`}
                                title="Deletar aula"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            )}
                            {/* Ícone de lixeira - apenas para provas e trabalhos e apenas para professor */}
                            {(evento.tipo === "prova" || evento.tipo === "trabalho") && user?.role === "professor" && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAtividade(evento);
                                }}
                                className={`absolute top-2 right-2 transition-colors ${
                                  evento.tipo === "prova"
                                    ? "text-red-600 hover:text-red-800"
                                    : evento.tipo === "trabalho"
                                    ? "text-blue-600 hover:text-red-600"
                                    : ""
                                }`}
                                title={`Deletar ${evento.tipo}`}
                              >
                                <FiTrash2 size={16} />
                              </button>
                            )}
                            {/* Título, status de presença e nota na mesma linha */}
                            <div className={`flex items-center justify-between gap-2 ${
                              (evento.tipo === "aula" && user?.role === "admin") ||
                              ((evento.tipo === "prova" || evento.tipo === "trabalho") && user?.role === "professor")
                                ? "pr-6" 
                                : ""
                            }`}>
                              <div className="font-semibold truncate flex-1 min-w-0">
                                {evento.titulo}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {/* Status de presença - apenas para aulas e apenas para alunos */}
                                {evento.tipo === "aula" && evento.statusPresenca && user?.role === "aluno" && (
                                  <div className={`text-xs font-bold ${
                                    evento.statusPresenca === "Presente" 
                                      ? "text-green-600" 
                                      : "text-red-600"
                                  }`}>
                                    {evento.statusPresenca}
                                  </div>
                                )}
                                {/* Nota - apenas para atividades (prova/trabalho) e apenas para alunos */}
                                {(evento.tipo === "prova" || evento.tipo === "trabalho") && evento.nota !== null && evento.nota !== undefined && user?.role === "aluno" && (
                                  <div className="text-xs font-bold text-gray-700">
                                    Nota: {parseFloat(evento.nota).toFixed(1)}
                                  </div>
                                )}
                              </div>
                            </div>
                            {evento.horarioInicio && evento.horarioFim && (
                              <div className={`text-xs mt-1 ${
                                evento.tipo === "aula"
                                  ? "text-orange-600 opacity-80"
                                  : evento.tipo === "prova"
                                  ? "text-red-600 opacity-80"
                                  : evento.tipo === "trabalho"
                                  ? "text-blue-600 opacity-80"
                                  : "text-gray-600 opacity-80"
                              }`}>
                                {evento.horarioInicio} - {evento.horarioFim}
                              </div>
                            )}
                            {evento.tipo === "aula" && evento.turmaNome && (
                              <div className={`text-xs mt-1 flex items-center gap-2 ${
                                evento.tipo === "aula"
                                  ? "text-orange-600 opacity-80"
                                  : ""
                              }`}>
                                <span>{evento.turmaNome}</span>
                                {evento.nivelEducacional && (
                                  <>
                                    <span>•</span>
                                    <span>{formatNivelEducacional(evento.nivelEducacional)}</span>
                                  </>
                                )}
                              </div>
                            )}
                            {(evento.tipo === "prova" || evento.tipo === "trabalho") && evento.turmaNome && (
                              <div className={`text-xs mt-1 flex items-center gap-2 ${
                                evento.tipo === "prova"
                                  ? "text-red-600 opacity-80"
                                  : evento.tipo === "trabalho"
                                  ? "text-blue-600 opacity-80"
                                  : ""
                              }`}>
                                <span>{evento.turmaNome}</span>
                                {evento.nivelEducacional && (
                                  <>
                                    <span>•</span>
                                    <span>{formatNivelEducacional(evento.nivelEducacional)}</span>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-xs sm:text-sm h-full">
                      {/* Espaço vazio */}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Botão voltar */}
      <div className="flex justify-end">
        <button
          onClick={() => navigate("/aulas")}
          className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
