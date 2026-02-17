import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  FiLock,
  FiUnlock,
  FiMoreVertical,
  FiChevronDown,
  FiChevronUp,
  FiPlay,
  FiVideo,
  FiFileText,
  FiTrash2,
  FiEdit,
  FiPlus,
  FiCheck,
  FiDownload,
  FiEye,
} from "react-icons/fi";
import computadores from "../../assets/computadores.png";
import cursoService from "../../services/curso.service";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import { useAuth } from "../../context/AuthContext";
import {
  showInfoToast,
  showConfirmDeleteToast,
  showSuccessToast,
  showErrorToast,
  showWarningToast,
} from "../../components/feedback/toastConfig";
import { ProgressCircle } from "../../components/ui/ProgressCircle";
import progressoCursoService from "../../services/progressoCurso.service";
import { Avatar } from "../../components/ui/Avatar";
import { CertificateModal } from "../../components/ui/CertificateModal";

export function CursoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const userRole = user?.role || "aluno";

  // Verificar se está acessando via lista de cursos (inscrito) ou página de cursos (não inscrito)
  const isFromListaCursos = location.pathname.includes("/listacursos/curso/");
  const isFromDashboard = location.pathname.includes("/cursos/") && !isFromListaCursos;
  const podeAcessarConteudo =
    isFromListaCursos || userRole === "professor" || userRole === "admin";
  const [expandedChapters, setExpandedChapters] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const [curso, setCurso] = useState(null);
  const [conteudo, setConteudo] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [aulaSelecionada, setAulaSelecionada] = useState(null);
  const [estaInscrito, setEstaInscrito] = useState(false);
  const [isInscrendo, setIsInscrendo] = useState(false);
  const [progresso, setProgresso] = useState({
    progressoPercentual: 0,
    status: "em_andamento",
  });
  const [aulasConcluidas, setAulasConcluidas] = useState([]);
  const [timestampsVideos, setTimestampsVideos] = useState({});
  const [ultimaAulaVisualizada, setUltimaAulaVisualizada] = useState(null);
  const videoRef = useRef(null);
  const lastSavedTimestampRef = useRef({});
  const [professor, setProfessor] = useState(null);
  const [materia, setMateria] = useState(null);
  const [dataCriacao, setDataCriacao] = useState(null);
  const [activeTab, setActiveTab] = useState("descricao");
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest("[data-menu-container]")) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  // Função para formatar duração em minutos para "Xmin"
  const formatarDuracao = (minutos) => {
    if (!minutos || minutos === 0) return "1 min";
    return `${minutos}min`;
  };

  // Função para calcular duração total de um capítulo
  const calcularDuracaoCapitulo = (aulas) => {
    if (!aulas || aulas.length === 0) return "0min";
    const totalMinutos = aulas.reduce((acc, aula) => {
      return acc + (aula.duracaoMinutos || (aula.tipo === "texto" ? 1 : 0));
    }, 0);
    return formatarDuracao(totalMinutos);
  };

  // Selecionar próxima aula não concluída
  const selecionarProximaAulaNaoConcluida = () => {
    if (
      !conteudo ||
      conteudo.length === 0 ||
      userRole !== "aluno" ||
      !estaInscrito
    )
      return;

    // Se há última aula visualizada, tentar encontrar próxima
    if (ultimaAulaVisualizada) {
      let encontrou = false;
      let proximaAula = null;

      for (const capitulo of conteudo) {
        if (capitulo.tipo !== "capitulo" || !capitulo.aulas) continue;

        for (const aula of capitulo.aulas) {
          const capituloOrdem = aula.capituloOrdem;
          const aulaOrdem = aula.aulaOrdem;

          // Se encontrou a última aula visualizada, próxima será a próxima não concluída
          if (
            encontrou &&
            !isAulaConcluida(capituloOrdem, aulaOrdem) &&
            !aula.bloqueado
          ) {
            proximaAula = aula;
            break;
          }

          // Marcar quando encontrar a última aula visualizada
          if (
            capituloOrdem === ultimaAulaVisualizada.capituloOrdem &&
            aulaOrdem === ultimaAulaVisualizada.aulaOrdem
          ) {
            encontrou = true;
          }
        }

        if (proximaAula) break;
      }

      if (proximaAula) {
        setAulaSelecionada(proximaAula);
        return;
      }
    }

    // Se não encontrou próxima após última visualizada, buscar primeira não concluída
    for (const capitulo of conteudo) {
      if (capitulo.tipo !== "capitulo" || !capitulo.aulas) continue;

      for (const aula of capitulo.aulas) {
        if (
          !isAulaConcluida(aula.capituloOrdem, aula.aulaOrdem) &&
          !aula.bloqueado
        ) {
          setAulaSelecionada(aula);
          return;
        }
      }
    }
  };

  // Verificar se aula está concluída
  const isAulaConcluida = (capituloOrdem, aulaOrdem) => {
    // Garantir que os valores sejam números para comparação consistente
    const capOrdem = Number(capituloOrdem);
    const aulOrdem = Number(aulaOrdem);
    const aulaKey = `${capOrdem}-${aulOrdem}`;
    const estaConcluida = aulasConcluidas.includes(aulaKey);
    return estaConcluida;
  };

  // Buscar progresso do curso
  const buscarProgresso = async () => {
    if (!id || userRole !== "aluno") return;

    try {
      const result = await progressoCursoService.getProgresso(id);
      if (result.success && result.data) {
        setProgresso({
          progressoPercentual: result.data.progressoPercentual || 0,
          status: result.data.status || "em_andamento",
          dataConclusao: result.data.dataConclusao,
        });

        // Extrair lista de aulas concluídas e timestamps
        const concluidas = [];
        const timestamps = {};

        // Usar aulasConcluidas diretamente do backend (mais confiável)
        if (
          result.data.aulasConcluidas &&
          Array.isArray(result.data.aulasConcluidas)
        ) {
          result.data.aulasConcluidas.forEach((aula) => {
            // Garantir que os valores sejam números
            const capOrdem = Number(aula.capituloOrdem);
            const aulOrdem = Number(aula.aulaOrdem);
            const aulaKey = `${capOrdem}-${aulOrdem}`;
            concluidas.push(aulaKey);

            if (aula.tipo === "video" && aula.timestampVideo) {
              timestamps[aulaKey] = aula.timestampVideo;
            }
          });
        }

        // Também verificar progressoPorCapitulo como fallback
        if (result.data.progressoPorCapitulo) {
          result.data.progressoPorCapitulo.forEach((capitulo) => {
            const capOrdem = Number(capitulo.ordem);
            capitulo.aulas.forEach((aula) => {
              if (aula.concluida) {
                const aulOrdem = Number(aula.ordem);
                const aulaKey = `${capOrdem}-${aulOrdem}`;
                if (!concluidas.includes(aulaKey)) {
                  concluidas.push(aulaKey);
                }
              }
            });
          });
        }

        setAulasConcluidas(concluidas);
        setTimestampsVideos(timestamps);

        // Definir última aula visualizada
        if (result.data.ultimaAulaVisualizada) {
          setUltimaAulaVisualizada(result.data.ultimaAulaVisualizada);
        }

        // Selecionar próxima aula não concluída após carregar progresso
        setTimeout(() => {
          selecionarProximaAulaNaoConcluida();
        }, 100);
      }
    } catch {
      // Silenciosamente falhar se não conseguir buscar progresso
    }
  };

  // Transformar dados do backend para o formato esperado pela página
  const transformarDadosCurso = (cursoData) => {
    if (!cursoData) return null;

    const cursoTransformado = {
      _id: cursoData._id,
      titulo: cursoData.titulo || "",
      descricao: cursoData.descricao || "",
      bloqueado: cursoData.status !== "ativo",
      bloqueadoPorAdmin: cursoData.bloqueadoPorAdmin || false,
      capa: cursoData.capa?.url || computadores, // Usar capa do curso ou imagem padrão
      professorId: cursoData.professorId,
      materiaId: cursoData.materiaId,
    };

    // Transformar capítulos e aulas
    const conteudoTransformado = (cursoData.capitulos || []).map(
      (capitulo, index) => {
        const aulasTransformadas = (capitulo.aulas || []).map(
          (aula, aulaIndex) => {
            const capOrdem = Number(capitulo.ordem || index + 1);
            const aulOrdem = Number(aula.ordem || aulaIndex + 1);
            return {
              id: `${capOrdem}-${aulOrdem}`,
              capituloOrdem: capOrdem,
              aulaOrdem: aulOrdem,
              tipo: "aula",
              titulo: aula.titulo || "",
              duracao:
                aula.tipo === "texto"
                  ? "1 min"
                  : formatarDuracao(aula.duracaoMinutos),
              formato: aula.tipo || "video",
              conteudo: aula.conteudo || "", // Armazenar conteúdo da aula
              bloqueado: false, // Por enquanto não há bloqueio individual de aulas
            };
          },
        );

        // Se o curso está bloqueado, todos os capítulos também estão bloqueados
        const cursoBloqueado = cursoData.status !== "ativo";
        const capituloBloqueado = cursoBloqueado || capitulo.bloqueado === true;

        return {
          id: index,
          tipo: "capitulo",
          titulo: `${index + 1}. ${capitulo.titulo || ""}`,
          duracao: calcularDuracaoCapitulo(capitulo.aulas || []),
          expandido: false,
          bloqueado: capituloBloqueado,
          bloqueadoPorAdmin: capitulo.bloqueadoPorAdmin || false,
          aulas: aulasTransformadas,
        };
      },
    );

    return {
      curso: cursoTransformado,
      conteudo: conteudoTransformado,
    };
  };

  // Buscar dados do curso do backend
  useEffect(() => {
    const fetchCurso = async () => {
      if (!id) {
        setError("ID do curso não fornecido");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await cursoService.getById(id);

        if (result.success && result.data) {
          const dadosTransformados = transformarDadosCurso(result.data);
          if (dadosTransformados) {
            setCurso(dadosTransformados.curso);
            setConteudo(dadosTransformados.conteudo);

            // Extrair dados do professor e matéria
            if (result.data.professorId) {
              setProfessor(result.data.professorId);
            }
            if (result.data.materiaId) {
              setMateria(result.data.materiaId);
            }
            // Extrair data de criação
            if (result.data.createdAt) {
              setDataCriacao(result.data.createdAt);
            }

            // Se for aluno, verificar se está inscrito
            if (
              userRole === "aluno" &&
              result.data.estaInscrito !== undefined
            ) {
              setEstaInscrito(result.data.estaInscrito);

              // Se estiver inscrito E vier da lista de cursos, buscar progresso
              if (result.data.estaInscrito && isFromListaCursos) {
                buscarProgresso();
              }
            }

            // Não selecionar nenhuma aula automaticamente
            // A capa do curso será exibida inicialmente
            // O usuário deve clicar em uma aula para ver o conteúdo
          } else {
            setError("Erro ao processar dados do curso");
          }
        } else {
          setError(result.error || "Erro ao buscar curso");
        }
      } catch (err) {
        setError("Erro ao carregar curso. Tente novamente.");
        console.error("Erro ao buscar curso:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurso();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Mostrar loading enquanto busca dados
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Mostrar erro se houver
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 text-lg font-semibold mb-2">
            Erro ao carregar curso
          </p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  // Se não houver curso, mostrar mensagem
  if (!curso) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Curso não encontrado</p>
        </div>
      </div>
    );
  }

  const toggleChapter = (chapterId) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const toggleMenu = (itemId, e) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === itemId ? null : itemId);
  };

  // Alternar bloqueio do curso (bloqueia/desbloqueia curso e todos os capítulos)
  const toggleCursoBloqueado = async () => {
    if (!curso) return;

    // Verificar se professor pode desbloquear (não pode se foi bloqueado por admin)
    if (
      userRole === "professor" &&
      curso.bloqueadoPorAdmin &&
      curso.bloqueado
    ) {
      showInfoToast(
        "ℹ️ Este curso ou capítulo foi bloqueado pelo admin, entre em contato por (admin@escola.com.br), para verificar o caso",
      );
      return;
    }

    const novoStatus = curso.bloqueado ? "ativo" : "inativo";
    const novoBloqueado = !curso.bloqueado;

    try {
      // Atualizar o status do curso no backend
      // O backend automaticamente atualiza todos os capítulos quando o status muda
      const result = await cursoService.update(curso._id, {
        status: novoStatus,
      });

      if (result.success) {
        // Recarregar os dados do curso para garantir sincronização
        const cursoAtualizado = await cursoService.getById(curso._id);

        if (cursoAtualizado.success && cursoAtualizado.data) {
          // Transformar e atualizar os dados
          const dadosTransformados = transformarDadosCurso(
            cursoAtualizado.data,
          );
          if (dadosTransformados) {
            setCurso(dadosTransformados.curso);
            setConteudo(dadosTransformados.conteudo);
          }
        } else {
          // Fallback: atualizar apenas o estado local
          setCurso((prev) => ({
            ...prev,
            bloqueado: novoBloqueado,
          }));

          setConteudo((prev) =>
            prev.map((item) => {
              if (item.tipo === "capitulo") {
                return {
                  ...item,
                  bloqueado: novoBloqueado,
                };
              }
              return item;
            }),
          );
        }
      } else {
        showInfoToast(`ℹ️ Erro ao atualizar curso: ${result.error}`);
      }
    } catch {
      showInfoToast("ℹ️ Erro ao atualizar curso. Tente novamente.");
    }
  };

  // Alternar bloqueio do capítulo (apenas o capítulo específico)
  const toggleCapituloBloqueado = async (capituloId) => {
    if (!curso) return;

    // Encontrar o capítulo no conteúdo
    const capitulo = conteudo.find(
      (item) => item.id === capituloId && item.tipo === "capitulo",
    );
    if (!capitulo) return;

    // Verificar se professor pode desbloquear (não pode se foi bloqueado por admin)
    if (
      userRole === "professor" &&
      capitulo.bloqueadoPorAdmin &&
      capitulo.bloqueado
    ) {
      showInfoToast(
        "ℹ️ Este curso ou capítulo foi bloqueado pelo admin, entre em contato por (admin@escola.com.br), para verificar o caso",
      );
      setOpenMenuId(null);
      return;
    }

    // Não permitir desbloquear capítulo se o curso está bloqueado
    if (curso.bloqueado && !capitulo.bloqueado) {
      showInfoToast(
        "ℹ️ Não é possível desbloquear capítulo quando o curso está bloqueado",
      );
      setOpenMenuId(null);
      return;
    }

    const novoBloqueado = !capitulo.bloqueado;

    try {
      // Buscar o curso atualizado do backend
      const cursoResult = await cursoService.getById(curso._id);

      if (cursoResult.success && cursoResult.data) {
        // Atualizar apenas o capítulo específico no array de capítulos
        const capitulosAtualizados = cursoResult.data.capitulos.map(
          (cap, index) => {
            if (index === capituloId) {
              return {
                ...cap,
                bloqueado: novoBloqueado,
                bloqueadoPorAdmin:
                  userRole === "admin"
                    ? novoBloqueado
                    : cap.bloqueadoPorAdmin || false,
              };
            }
            return cap;
          },
        );

        // Atualizar apenas os capítulos no backend (sem alterar o status do curso)
        const updateResult = await cursoService.update(curso._id, {
          capitulos: capitulosAtualizados,
        });

        if (updateResult.success) {
          // Recarregar o curso para garantir sincronização
          const cursoAtualizado = await cursoService.getById(curso._id);
          if (cursoAtualizado.success && cursoAtualizado.data) {
            const dadosTransformados = transformarDadosCurso(
              cursoAtualizado.data,
            );
            if (dadosTransformados) {
              setCurso(dadosTransformados.curso);
              setConteudo(dadosTransformados.conteudo);
            }
          }
        } else {
          showInfoToast(`ℹ️ Erro ao atualizar capítulo: ${updateResult.error}`);
        }
      }
    } catch {
      showInfoToast("ℹ️ Erro ao atualizar capítulo. Tente novamente.");
    }

    setOpenMenuId(null);
  };

  // Deletar curso
  const deletarCurso = async () => {
    if (!curso) return;

    showConfirmDeleteToast(
      `🗑️ Tem certeza que deseja deletar ${curso.titulo}?`,
      async () => {
        try {
          const result = await cursoService.delete(curso._id);
          if (result.success) {
            showSuccessToast("✅ Curso deletado com sucesso");
            setTimeout(() => {
              navigate("/dashboard");
            }, 1000);
          } else {
            showInfoToast(`ℹ️ Erro ao deletar curso: ${result.error}`);
          }
        } catch {
          showInfoToast("ℹ️ Erro ao deletar curso. Tente novamente.");
        }
      },
      () => {
        // Cancelar - não fazer nada
      },
    );
  };

  // Deletar capítulo
  const deletarCapitulo = async (capituloId) => {
    if (!curso) return;

    const capitulo = conteudo.find(
      (item) => item.id === capituloId && item.tipo === "capitulo",
    );
    if (!capitulo) return;

    setOpenMenuId(null);

    showConfirmDeleteToast(
      `🗑️ Tem certeza que deseja deletar ${capitulo.titulo}?`,
      async () => {
        try {
          const result = await cursoService.deleteCapitulo(
            curso._id,
            capituloId,
          );
          if (result.success) {
            showSuccessToast("✅ Capítulo deletado com sucesso");
            // Recarregar o curso
            const cursoResult = await cursoService.getById(curso._id);
            if (cursoResult.success && cursoResult.data) {
              const dadosTransformados = transformarDadosCurso(
                cursoResult.data,
              );
              if (dadosTransformados) {
                setCurso(dadosTransformados.curso);
                setConteudo(dadosTransformados.conteudo);
              }
            }
          } else {
            showInfoToast(`ℹ️ Erro ao deletar capítulo: ${result.error}`);
          }
        } catch {
          showInfoToast("ℹ️ Erro ao deletar capítulo. Tente novamente.");
        }
      },
      () => {
        // Cancelar - não fazer nada
      },
    );
  };

  // Deletar aula
  const deletarAula = async (aulaId) => {
    if (!curso) return;

    // Procurar a aula nos capítulos e obter os índices
    let aulaEncontrada = null;
    let capituloIndex = -1;
    let aulaIndex = -1;

    for (let capIdx = 0; capIdx < conteudo.length; capIdx++) {
      const capitulo = conteudo[capIdx];
      if (capitulo.tipo === "capitulo" && capitulo.aulas) {
        for (let aulaIdx = 0; aulaIdx < capitulo.aulas.length; aulaIdx++) {
          if (capitulo.aulas[aulaIdx].id === aulaId) {
            aulaEncontrada = capitulo.aulas[aulaIdx];
            capituloIndex = capIdx;
            aulaIndex = aulaIdx;
            break;
          }
        }
        if (aulaEncontrada) break;
      } else if (capitulo.tipo === "aula" && capitulo.id === aulaId) {
        aulaEncontrada = capitulo;
        // Para aulas individuais (sem capítulo), precisamos encontrar o índice
        // Por enquanto, não suportamos deletar aulas individuais
        break;
      }
    }

    if (!aulaEncontrada || capituloIndex === -1 || aulaIndex === -1) {
      showInfoToast(`ℹ️ Aula não encontrada`);
      return;
    }

    setOpenMenuId(null);

    showConfirmDeleteToast(
      `🗑️ Tem certeza que deseja deletar ${aulaEncontrada.titulo}?`,
      async () => {
        try {
          const result = await cursoService.deleteAula(
            curso._id,
            capituloIndex,
            aulaIndex,
          );
          if (result.success) {
            showSuccessToast("✅ Aula deletada com sucesso");
            // Recarregar o curso
            const cursoResult = await cursoService.getById(curso._id);
            if (cursoResult.success && cursoResult.data) {
              const dadosTransformados = transformarDadosCurso(
                cursoResult.data,
              );
              if (dadosTransformados) {
                setCurso(dadosTransformados.curso);
                setConteudo(dadosTransformados.conteudo);
                // Se a aula deletada era a selecionada, limpar seleção
                if (aulaSelecionada && aulaSelecionada.id === aulaId) {
                  setAulaSelecionada(null);
                }
              }
            }
          } else {
            showInfoToast(`ℹ️ Erro ao deletar aula: ${result.error}`);
          }
        } catch {
          showInfoToast("ℹ️ Erro ao deletar aula. Tente novamente.");
        }
      },
      () => {
        // Cancelar - não fazer nada
      },
    );
  };

  const handleMenuAction = (action, itemId) => {
    if (action === "Bloquer" || action === "Liberar") {
      toggleCapituloBloqueado(itemId);
    } else if (action === "Deletar") {
      const item = conteudo.find((i) => i.id === itemId);
      if (item && item.tipo === "capitulo") {
        deletarCapitulo(itemId);
      } else {
        deletarAula(itemId);
      }
    } else if (action === "Editar") {
      // Encontrar a aula e navegar para o formulário de edição
      console.log("Editando aula, itemId:", itemId, "conteudo:", conteudo);

      // Procurar primeiro diretamente no conteudo
      let item = conteudo.find((i) => i.id === itemId);

      // Se não encontrou, procurar dentro dos capítulos
      if (!item || item.tipo !== "aula") {
        for (const capitulo of conteudo) {
          if (capitulo.tipo === "capitulo" && capitulo.aulas) {
            const aulaEncontrada = capitulo.aulas.find((a) => a.id === itemId);
            if (aulaEncontrada) {
              item = aulaEncontrada;
              console.log("Aula encontrada dentro do capítulo:", item);
              break;
            }
          }
        }
      }

      if (item) {
        if (item.tipo === "capitulo") {
          // Navegar para edição de capítulo
          const capituloIndex =
            typeof item.id === "number" ? item.id : parseInt(item.id);
          if (
            !isNaN(capituloIndex) &&
            capituloIndex >= 0 &&
            curso &&
            curso._id
          ) {
            const url = `/curso/${curso._id}/capitulo/${capituloIndex}/editar`;
            console.log("Navegando para edição de capítulo:", url);
            navigate(url);
          } else {
            console.error("Erro ao navegar: índice de capítulo inválido", {
              capituloIndex,
              cursoId: curso?._id,
              itemId,
            });
            showErrorToast("Erro ao abrir formulário de edição");
          }
        } else if (item.tipo === "aula") {
          // O ID da aula é no formato "capituloIndex-aulaIndex"
          const [capituloIndex, aulaIndex] = itemId.split("-").map(Number);
          console.log("Índices extraídos:", {
            capituloIndex,
            aulaIndex,
            cursoId: curso?._id,
          });

          if (
            !isNaN(capituloIndex) &&
            !isNaN(aulaIndex) &&
            capituloIndex >= 0 &&
            aulaIndex >= 0 &&
            curso &&
            curso._id
          ) {
            const url = `/curso/${curso._id}/capitulo/${capituloIndex}/aula/${aulaIndex}/editar`;
            console.log("Navegando para edição de aula:", url);
            navigate(url);
          } else {
            console.error(
              "Erro ao navegar: índices inválidos ou curso não encontrado",
              {
                capituloIndex,
                aulaIndex,
                cursoId: curso?._id,
                itemId,
              },
            );
            showErrorToast("Erro ao abrir formulário de edição");
          }
        }
      } else {
        console.error("Item não encontrado para edição", {
          itemId,
          item,
          conteudo,
        });
        showErrorToast("Item não encontrado");
      }
      setOpenMenuId(null);
    } else {
      setOpenMenuId(null);
    }
  };

  const isExpanded = (item) => {
    if (item.tipo === "capitulo") {
      return expandedChapters[item.id] !== undefined
        ? expandedChapters[item.id]
        : item.expandido;
    }
    return false;
  };

  // Selecionar aula para exibir conteúdo
  const selecionarAula = (aula) => {
    if (curso.bloqueado || aula.bloqueado) return;

    // Se for aluno e não pode acessar conteúdo (não está inscrito), mostrar toast
    if (userRole === "aluno" && !podeAcessarConteudo) {
      showWarningToast(
        "⚠️ Para visualizar conteúdo do curso, adicione ele a sua lista",
      );
      return;
    }

    setAulaSelecionada(aula);
  };

  // Marcar aula como concluída
  const marcarAulaConcluida = async (capituloOrdem, aulaOrdem, tipo) => {
    if (!id || !estaInscrito) return;

    const aulaKey = `${capituloOrdem}-${aulaOrdem}`;

    // Se já está concluída, não fazer nada
    if (aulasConcluidas.includes(aulaKey)) return;

    try {
      const result = await progressoCursoService.marcarAulaConcluida({
        cursoId: id,
        capituloOrdem,
        aulaOrdem,
        tipo,
      });

      if (result.success) {
        setAulasConcluidas([...aulasConcluidas, aulaKey]);
        await buscarProgresso(); // Atualizar progresso
        showSuccessToast("✅ Aula marcada como concluída!");
      } else {
        showErrorToast(result.error || "Erro ao marcar aula como concluída");
      }
    } catch {
      showErrorToast("Erro ao marcar aula como concluída");
    }
  };

  // Salvar timestamp do vídeo
  const salvarTimestampVideo = async (capituloOrdem, aulaOrdem, timestamp) => {
    if (!id || !podeAcessarConteudo) return;

    try {
      await progressoCursoService.salvarTimestampVideo({
        cursoId: id,
        capituloOrdem,
        aulaOrdem,
        timestampVideo: Math.floor(timestamp),
      });

      // Atualizar estado local
      setTimestampsVideos((prev) => ({
        ...prev,
        [`${capituloOrdem}-${aulaOrdem}`]: timestamp,
      }));
    } catch {
      // Silenciosamente falhar
    }
  };

  // Adicionar curso à lista de aprendizagem
  const adicionarALista = async () => {
    if (!id || isInscrendo) return;

    setIsInscrendo(true);
    try {
      const result = await cursoService.inscrever(id);
      if (result.success) {
        setEstaInscrito(true);
        // Redirecionar para a página de lista de cursos após inscrever
        navigate(`/listacursos/curso/${id}`);
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

  // Baixar certificado
  const baixarCertificado = async () => {
    if (!id) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/progresso-curso/certificado/${id}`,
        {
          method: "GET",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
      );

      if (!response.ok) {
        showErrorToast("Erro ao gerar certificado");
        return;
      }

      // Criar blob e fazer download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificado-${curso?.titulo || "curso"}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      showErrorToast("Erro ao baixar certificado");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Título do Curso */}
      <div className="bg-white border-b border-gray-200 -mx-4 sm:-mx-6 lg:-mx-12 xl:-mx-16 2xl:-mx-24">
        <div className="px-4 sm:px-6 lg:px-12 xl:px-16 2xl:px-24 py-3 sm:py-4">
          <div className="flex flex-row items-center justify-between gap-2 sm:gap-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-orange-500 wrap-break-word flex-1">
              {curso.titulo}
            </h1>
            {/* Botão de adicionar à lista ou círculo de progresso - apenas para aluno */}
            {userRole === "aluno" && (
              <>
                {estaInscrito && isFromListaCursos ? (
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    <ProgressCircle
                      progresso={progresso.progressoPercentual}
                      isCompleto={progresso.status === "completo"}
                      size={60}
                    />
                    {progresso.status === "completo" && (
                      <>
                        <button
                          onClick={() => setIsCertificateModalOpen(true)}
                          className="bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-50 cursor-pointer transition-colors rounded-lg py-2 px-4 sm:px-6 text-sm font-medium flex items-center gap-2 shrink-0"
                        >
                          <FiEye size={18} />
                          <span className="hidden sm:inline">
                            Visualizar Certificado
                          </span>
                          <span className="sm:hidden">Visualizar</span>
                        </button>
                        <button
                          onClick={baixarCertificado}
                          className="bg-orange-500 text-white hover:bg-orange-600 cursor-pointer transition-colors rounded-lg py-2 px-4 sm:px-6 text-sm font-medium flex items-center gap-2 shrink-0"
                        >
                          <FiDownload size={18} />
                          <span className="hidden sm:inline">
                            Baixar Certificado
                          </span>
                          <span className="sm:hidden">Baixar</span>
                        </button>
                      </>
                    )}
                  </div>
                ) : estaInscrito && !isFromListaCursos ? (
                  <div className="flex items-center gap-2 text-green-600 px-4 py-2 rounded-lg bg-green-50 border border-green-200 shrink-0">
                    <FiCheck size={18} />
                    <span className="text-sm font-medium">
                      Já inscrito no curso
                    </span>
                  </div>
                ) : !isFromListaCursos ? (
                  <button
                    onClick={adicionarALista}
                    disabled={isInscrendo}
                    className="bg-orange-500 text-white hover:bg-orange-600 cursor-pointer transition-colors rounded-lg py-2 px-4 sm:px-6 text-sm font-medium flex items-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiPlus size={18} />
                    <span className="hidden sm:inline">Adicionar à Lista</span>
                    <span className="sm:hidden">Adicionar</span>
                  </button>
                ) : null}
              </>
            )}
            {/* Botões de controle - apenas para professor e admin */}
            {(userRole === "professor" || userRole === "admin") && (
              <div className="flex items-center gap-2 shrink-0">
                {/* Botão de editar curso - apenas para professor */}
                {userRole === "professor" && (
                  <button
                    onClick={() => {
                      navigate(`/curso/${id}/editar`);
                    }}
                    className="border-2 border-gray-400 text-gray-600 hover:bg-gray-50 rounded-lg p-2 transition-colors touch-manipulation"
                    aria-label="Editar curso"
                  >
                    <FiEdit size={18} />
                  </button>
                )}
                {/* Botão de deletar curso - apenas para professor */}
                {userRole === "professor" && (
                  <button
                    onClick={deletarCurso}
                    className="border-2 border-red-500 text-red-500 hover:bg-red-50 rounded-lg p-2 transition-colors touch-manipulation"
                    aria-label="Deletar curso"
                  >
                    <FiTrash2 size={18} />
                  </button>
                )}
                {/* Botão de bloquear/desbloquear curso */}
                <button
                  onClick={toggleCursoBloqueado}
                  className={`border-2 rounded-lg p-2 transition-colors touch-manipulation ${
                    curso.bloqueado
                      ? "border-red-500 text-red-500 hover:bg-red-50"
                      : "border-orange-500 text-orange-500 hover:bg-orange-50"
                  }`}
                  aria-label={
                    curso.bloqueado ? "Curso bloqueado" : "Curso desbloqueado"
                  }
                >
                  {curso.bloqueado ? (
                    <FiLock size={18} />
                  ) : (
                    <FiUnlock size={18} />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-4 sm:gap-6 ${
        podeAcessarConteudo && userRole === "aluno" 
          ? "lg:grid-cols-3" 
          : "lg:grid-cols-3"
      }`}>
        {/* Painel Esquerdo - Vídeo e Descrição */}
        <div className={`space-y-3 sm:space-y-4 relative ${
          podeAcessarConteudo && userRole === "aluno" 
            ? "lg:col-span-2" 
            : "lg:col-span-2"
        }`}>
          {/* Overlay quando bloqueado */}
          {curso.bloqueado && (
            <div className="absolute inset-0 bg-gray-200/60 backdrop-blur-sm z-10 rounded-lg pointer-events-none" />
          )}

          {/* Área do Vídeo/Conteúdo */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video w-full">
            {!podeAcessarConteudo && userRole === "aluno" ? (
              // Mostrar capa do curso quando não pode acessar conteúdo
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <img
                  src={curso.capa}
                  alt="Capa do curso"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : aulaSelecionada ? (
              aulaSelecionada.formato === "video" ? (
                // Player de vídeo
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <video
                    ref={videoRef}
                    src={aulaSelecionada.conteudo}
                    controls
                    className="w-full h-full object-cover"
                    controlsList="nodownload"
                    style={{
                      objectFit: "fill",
                      width: "100%",
                      height: "100%",
                    }}
                    onLoadedMetadata={() => {
                      // Carregar timestamp salvo quando vídeo carregar
                      if (videoRef.current && aulaSelecionada) {
                        const aulaKey = `${aulaSelecionada.capituloOrdem}-${aulaSelecionada.aulaOrdem}`;
                        const timestamp = timestampsVideos[aulaKey];
                        const duration = videoRef.current.duration;

                        // Só restaurar timestamp se não estiver muito próximo do final
                        // Evitar que vídeo próximo do final dispare onEnded automaticamente
                        if (
                          timestamp &&
                          timestamp > 0 &&
                          duration &&
                          timestamp < duration - 2
                        ) {
                          videoRef.current.currentTime = timestamp;
                        }
                      }
                    }}
                    onTimeUpdate={() => {
                      // Salvar timestamp periodicamente enquanto vídeo está sendo assistido
                      if (
                        videoRef.current &&
                        aulaSelecionada &&
                        userRole === "aluno" &&
                        podeAcessarConteudo
                      ) {
                        const currentTime = videoRef.current.currentTime;
                        const aulaKey = `${aulaSelecionada.capituloOrdem}-${aulaSelecionada.aulaOrdem}`;
                        const lastSaved =
                          lastSavedTimestampRef.current[aulaKey] || 0;

                        // Salvar a cada 5 segundos
                        if (
                          Math.floor(currentTime) - Math.floor(lastSaved) >=
                            5 &&
                          currentTime > 0
                        ) {
                          lastSavedTimestampRef.current[aulaKey] = currentTime;
                          salvarTimestampVideo(
                            aulaSelecionada.capituloOrdem,
                            aulaSelecionada.aulaOrdem,
                            currentTime,
                          );
                        }
                      }
                    }}
                    onPause={() => {
                      // Salvar timestamp quando vídeo pausar
                      if (
                        videoRef.current &&
                        aulaSelecionada &&
                        userRole === "aluno" &&
                        podeAcessarConteudo
                      ) {
                        salvarTimestampVideo(
                          aulaSelecionada.capituloOrdem,
                          aulaSelecionada.aulaOrdem,
                          videoRef.current.currentTime,
                        );
                      }
                    }}
                    onEnded={() => {
                      // Quando vídeo termina completamente, marcar como concluído
                      // Verificar se realmente chegou ao final (não apenas próximo)
                      if (
                        videoRef.current &&
                        userRole === "aluno" &&
                        estaInscrito &&
                        aulaSelecionada
                      ) {
                        const duration = videoRef.current.duration;
                        const currentTime = videoRef.current.currentTime;

                        // Só marcar como concluído se realmente chegou ao final
                        // (dentro de 1 segundo do final ou exatamente no final)
                        if (
                          duration &&
                          (currentTime >= duration - 1 ||
                            currentTime >= duration)
                        ) {
                          marcarAulaConcluida(
                            aulaSelecionada.capituloOrdem,
                            aulaSelecionada.aulaOrdem,
                            "video",
                          );
                        }
                      }
                    }}
                  >
                    Seu navegador não suporta a tag de vídeo.
                  </video>
                </div>
              ) : (
                // Conteúdo de texto
                <div className="w-full h-full bg-white p-4 sm:p-6 overflow-y-auto">
                  <div className="mb-4">
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-800 break-words">
                      {aulaSelecionada.titulo}
                    </h3>
                  </div>
                  <div className="prose prose-sm sm:prose-base max-w-none text-gray-700 whitespace-pre-wrap break-words overflow-hidden">
                    {aulaSelecionada.conteudo}
                  </div>
                </div>
              )
            ) : (
              // Mostrar capa do curso quando nenhuma aula está selecionada
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <img
                  src={curso.capa}
                  alt="Capa do curso"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Navegação com abas - apenas quando aluno está inscrito */}
          {podeAcessarConteudo && userRole === "aluno" ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-4 sm:mt-6">
              {/* Tabs */}
              <div className="border-b border-gray-200 overflow-x-auto">
                <div className="flex min-w-max">
                  <button
                    onClick={() => setActiveTab("descricao")}
                    className={`px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === "descricao"
                        ? "text-orange-500 border-b-2 border-orange-500 cursor-pointer"
                        : "text-gray-600 hover:text-orange-500 cursor-pointer"
                    }`}
                  >
                    Descrição
                  </button>
                  <button
                    onClick={() => setActiveTab("informacoes")}
                    className={`px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                      activeTab === "informacoes"
                        ? "text-orange-500 border-b-2 border-orange-500 cursor-pointer"
                        : "text-gray-600 hover:text-orange-500 cursor-pointer"
                    }`}
                  >
                    Informações
                  </button>
                </div>
              </div>

              {/* Conteúdo das abas */}
              <div className="p-3 sm:p-4 md:p-6">
                {activeTab === "descricao" && (
                  <div>
                    <p className="text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed break-words overflow-hidden">
                      {curso.descricao}
                    </p>
                  </div>
                )}
                {activeTab === "informacoes" && (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Professor */}
                    {professor && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2 sm:mb-3">
                          Professor
                        </h3>
                        <div className="flex items-center gap-3">
                          <Avatar
                            fotoPerfil={professor.userId?.fotoPerfil}
                            name={professor.userId?.name || "Professor"}
                            size="lg"
                          />
                          <div>
                            <p className="text-sm sm:text-base font-medium text-gray-800">
                              {professor.userId?.name || "Professor não informado"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Matéria */}
                    {materia && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2 sm:mb-3">
                          Matéria
                        </h3>
                        <p className="text-sm sm:text-base text-gray-800">
                          {materia.nome || "Matéria não informada"}
                        </p>
                      </div>
                    )}

                    {/* Data de Criação */}
                    {dataCriacao && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-600 mb-2 sm:mb-3">
                          Data de Adição
                        </h3>
                        <p className="text-sm sm:text-base text-gray-800">
                          {new Date(dataCriacao).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Descrição normal quando aluno não está inscrito ou é professor/admin
            <div className="bg-white rounded-lg p-3 sm:p-4 md:p-6 border border-gray-200 relative mt-4 sm:mt-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">
                Descrição
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm md:text-base leading-relaxed break-words overflow-hidden">
                {curso.descricao}
              </p>
            </div>
          )}
        </div>

        {/* Painel Direito - Informações do Curso (quando vem do dashboard) e Conteúdo */}
        {(podeAcessarConteudo || isFromDashboard) && (
          <div className={`lg:col-span-1 ${isFromDashboard ? 'space-y-4 sm:space-y-6' : 'relative'}`}>
            {/* Div Lateral - Informações do Curso (sempre quando vem do dashboard) */}
            {isFromDashboard && (
              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 relative">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4 sm:mb-6">
                  Informações do Curso
                </h2>

                <div className="space-y-4 sm:space-y-6">
                  {/* Professor */}
                  {professor && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-2 sm:mb-3">
                        Professor
                      </h3>
                      <div className="flex items-center gap-3">
                        <Avatar
                          fotoPerfil={professor.userId?.fotoPerfil}
                          name={professor.userId?.name || "Professor"}
                          size="lg"
                        />
                        <div>
                          <p className="text-sm sm:text-base font-medium text-gray-800">
                            {professor.userId?.name || "Professor não informado"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Matéria */}
                  {materia && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-2 sm:mb-3">
                        Matéria
                      </h3>
                      <p className="text-sm sm:text-base text-gray-800">
                        {materia.nome || "Matéria não informada"}
                      </p>
                    </div>
                  )}

                  {/* Data de Criação */}
                  {dataCriacao && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-2 sm:mb-3">
                        Data de Adição
                      </h3>
                      <p className="text-sm sm:text-base text-gray-800">
                        {new Date(dataCriacao).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Painel de Conteúdo (apenas quando pode acessar conteúdo) */}
            {podeAcessarConteudo && (
              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 relative">
              {/* Overlay quando bloqueado */}
              {curso.bloqueado && (
                <div className="absolute inset-0 bg-gray-200/60 backdrop-blur-sm z-10 rounded-lg pointer-events-none" />
              )}

              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
                  Conteúdo
                </h2>

                <div className="space-y-1">
                  {conteudo.map((item) => (
                    <div key={item.id}>
                      {item.tipo === "capitulo" ? (
                        <div>
                          {/* Item do Capítulo */}
                          <div
                            className={`flex items-center justify-between p-2 sm:p-2.5 rounded group touch-manipulation ${
                              item.bloqueado
                                ? "bg-gray-100/60 opacity-70"
                                : curso.bloqueado
                                  ? "cursor-not-allowed opacity-60"
                                  : "hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                              <button
                                onClick={() => {
                                  // Bloquear expansão se não pode acessar conteúdo
                                  if (
                                    !podeAcessarConteudo &&
                                    userRole === "aluno"
                                  ) {
                                    showWarningToast(
                                      "⚠️ Para visualizar conteúdo do curso, adicione ele a sua lista",
                                    );
                                    return;
                                  }
                                  if (!curso.bloqueado && !item.bloqueado) {
                                    toggleChapter(item.id);
                                  }
                                }}
                                disabled={
                                  curso.bloqueado ||
                                  item.bloqueado ||
                                  (!podeAcessarConteudo && userRole === "aluno")
                                }
                                className={`shrink-0 p-1 touch-manipulation transition-colors ${
                                  curso.bloqueado || item.bloqueado
                                    ? "text-gray-400 cursor-not-allowed"
                                    : "text-gray-600 hover:text-orange-500 active:text-orange-600"
                                }`}
                                aria-label={
                                  isExpanded(item)
                                    ? "Colapsar capítulo"
                                    : "Expandir capítulo"
                                }
                              >
                                {isExpanded(item) ? (
                                  <FiChevronDown
                                    size={16}
                                    className="sm:w-4 sm:h-4"
                                  />
                                ) : (
                                  <FiChevronUp
                                    size={16}
                                    className="sm:w-4 sm:h-4"
                                  />
                                )}
                              </button>
                              <span
                                className={`text-xs sm:text-sm truncate flex-1 ${
                                  item.bloqueado
                                    ? "text-gray-500"
                                    : "text-gray-800"
                                }`}
                              >
                                {item.titulo}
                              </span>
                              <span
                                className={`text-xs whitespace-nowrap ml-1 sm:ml-2 shrink-0 ${
                                  item.bloqueado
                                    ? "text-gray-400"
                                    : "text-gray-500"
                                }`}
                              >
                                {item.duracao}
                              </span>
                            </div>
                            {/* Menu de opções - apenas para professor e admin */}
                            {(userRole === "professor" ||
                              userRole === "admin") && (
                              <div
                                className="relative shrink-0"
                                data-menu-container
                              >
                                <button
                                  onClick={(e) =>
                                    !curso.bloqueado && toggleMenu(item.id, e)
                                  }
                                  disabled={curso.bloqueado}
                                  className={`p-1.5 sm:p-1 touch-manipulation transition-colors ${
                                    curso.bloqueado
                                      ? "text-gray-300 cursor-not-allowed"
                                      : item.bloqueado
                                        ? "text-gray-500 hover:text-gray-700 active:text-gray-800"
                                        : "text-gray-400 hover:text-gray-600 active:text-gray-700"
                                  }`}
                                  aria-label="Menu de opções"
                                >
                                  <FiMoreVertical
                                    size={16}
                                    className="sm:w-4 sm:h-4"
                                  />
                                </button>
                                {openMenuId === item.id && (
                                  <div className="absolute right-0 top-9 sm:top-8 z-20 bg-white border border-red-500 rounded-lg shadow-lg min-w-[120px] sm:min-w-[140px]">
                                    {/* Botões de deletar e editar - apenas para professor */}
                                    {userRole === "professor" && (
                                      <>
                                        <button
                                          onClick={() =>
                                            handleMenuAction("Deletar", item.id)
                                          }
                                          className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-500 hover:bg-red-50 active:bg-red-100 rounded-t-lg touch-manipulation"
                                        >
                                          Deletar
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleMenuAction("Editar", item.id)
                                          }
                                          className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-500 hover:bg-red-50 active:bg-red-100"
                                        >
                                          Editar
                                        </button>
                                      </>
                                    )}
                                    {/* Botão de bloquear/desbloquear - para professor e admin */}
                                    <button
                                      onClick={() =>
                                        handleMenuAction(
                                          item.bloqueado
                                            ? "Liberar"
                                            : "Bloquer",
                                          item.id,
                                        )
                                      }
                                      className={`w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-blue-500 hover:bg-blue-50 active:bg-blue-100 ${
                                        userRole === "professor"
                                          ? ""
                                          : "rounded-t-lg"
                                      } ${userRole === "admin" ? "rounded-b-lg" : ""}`}
                                    >
                                      {item.bloqueado ? "Liberar" : "Bloquer"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Aulas do Capítulo (se expandido e não bloqueado) */}
                          {!curso.bloqueado &&
                            !item.bloqueado &&
                            isExpanded(item) &&
                            item.aulas &&
                            item.aulas.length > 0 && (
                              <div className="ml-4 sm:ml-6 space-y-1">
                                {item.aulas.map((aula) => {
                                  // Bloquear aulas se não pode acessar conteúdo
                                  const aulaBloqueada =
                                    !podeAcessarConteudo &&
                                    userRole === "aluno";

                                  return (
                                    <div
                                      key={aula.id}
                                      onClick={(e) => {
                                        // Não selecionar aula se clicou no menu ou se está bloqueada
                                        if (
                                          !e.target.closest(
                                            "[data-menu-container]",
                                          ) &&
                                          !aulaBloqueada
                                        ) {
                                          selecionarAula(aula);
                                        } else if (aulaBloqueada) {
                                          showWarningToast(
                                            "⚠️ Para visualizar conteúdo do curso, adicione ele a sua lista",
                                          );
                                        }
                                      }}
                                      className={`flex items-center justify-between p-2 sm:p-2.5 rounded group touch-manipulation ${
                                        aulaBloqueada
                                          ? "opacity-50 cursor-not-allowed"
                                          : aulaSelecionada?.id === aula.id
                                            ? "bg-orange-50 border border-orange-200"
                                            : "hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                                        {/* Checkbox para marcar aula como concluída - apenas para alunos inscritos via lista de cursos */}
                                        {/* Para vídeos, o checkbox é apenas visual (desabilitado) - só marca quando vídeo termina */}
                                        {/* Para textos, o aluno pode marcar manualmente */}
                                        {userRole === "aluno" &&
                                          podeAcessarConteudo && (
                                            <input
                                              type="checkbox"
                                              checked={isAulaConcluida(
                                                aula.capituloOrdem,
                                                aula.aulaOrdem,
                                              )}
                                              disabled={
                                                aula.formato === "video"
                                              }
                                              onChange={(e) => {
                                                e.stopPropagation();
                                                // Apenas permitir marcar manualmente aulas de texto
                                                if (
                                                  e.target.checked &&
                                                  aula.formato === "texto"
                                                ) {
                                                  marcarAulaConcluida(
                                                    aula.capituloOrdem,
                                                    aula.aulaOrdem,
                                                    aula.formato,
                                                  );
                                                }
                                              }}
                                              className={`w-4 h-4 text-white border-gray-300 rounded focus:ring-orange-500 checked:bg-orange-500 checked:border-orange-500 shrink-0 ${
                                                aula.formato === "video"
                                                  ? "cursor-not-allowed opacity-60"
                                                  : "cursor-pointer"
                                              }`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                // Prevenir clique em vídeos
                                                if (aula.formato === "video") {
                                                  e.preventDefault();
                                                }
                                              }}
                                              title={
                                                aula.formato === "video"
                                                  ? "Aulas de vídeo só são marcadas como concluídas quando você assiste até o final"
                                                  : "Marcar como concluída"
                                              }
                                            />
                                          )}
                                        <span className="text-xs sm:text-sm text-gray-700 truncate flex-1">
                                          {aula.titulo}
                                        </span>
                                        <div className="flex items-center gap-1.5 ml-1 sm:ml-2 shrink-0">
                                          {/* Ícone de tipo de conteúdo */}
                                          {aula.formato === "video" ? (
                                            <FiVideo
                                              className="text-gray-500"
                                              size={14}
                                            />
                                          ) : aula.formato === "texto" ? (
                                            <FiFileText
                                              className="text-gray-500"
                                              size={14}
                                            />
                                          ) : null}
                                          <span className="text-xs text-gray-500 whitespace-nowrap">
                                            {aula.formato === "texto"
                                              ? "1 min"
                                              : aula.duracao}
                                          </span>
                                        </div>
                                      </div>
                                      {/* Menu de opções de aula - apenas para professor */}
                                      {userRole === "professor" && (
                                        <div
                                          className="relative shrink-0"
                                          data-menu-container
                                        >
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation(); // Prevenir que o clique se propague para o div pai
                                              toggleMenu(aula.id, e);
                                            }}
                                            className="text-gray-400 hover:text-gray-600 active:text-gray-700 transition-colors p-1.5 sm:p-1 touch-manipulation"
                                            aria-label="Menu de opções"
                                          >
                                            <FiMoreVertical
                                              size={16}
                                              className="sm:w-4 sm:h-4"
                                            />
                                          </button>
                                          {openMenuId === aula.id && (
                                            <div className="absolute right-0 top-9 sm:top-8 z-20 bg-white border border-red-500 rounded-lg shadow-lg min-w-[120px] sm:min-w-[140px]">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleMenuAction(
                                                    "Deletar",
                                                    aula.id,
                                                  );
                                                }}
                                                className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-500 hover:bg-red-50 active:bg-red-100 rounded-t-lg touch-manipulation"
                                              >
                                                Deletar
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleMenuAction(
                                                    "Editar",
                                                    aula.id,
                                                  );
                                                }}
                                                className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-red-500 hover:bg-red-50 active:bg-red-100 rounded-b-lg touch-manipulation"
                                              >
                                                Editar
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Visualização do Certificado */}
      <CertificateModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        cursoId={id}
        cursoTitulo={curso?.titulo || "Curso"}
      />
    </div>
  );
}
