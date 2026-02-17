import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { showSuccessToast, showErrorToast, showWarningToast } from "../../components/feedback/toastConfig";
import atividadeService from "../../services/atividade.service";
import turmaService from "../../services/turma.service";
import aulaSemanalService from "../../services/aulaSemanal.service";
import { useAuth } from "../../context/AuthContext";

// Tipos de atividade disponíveis
const tiposAtividade = [
  { value: "PV1", label: "PV1", tipo: "prova" },
  { value: "PV2", label: "PV2", tipo: "prova" },
  { value: "PV3", label: "PV3", tipo: "prova" },
  { value: "TB1", label: "TB1", tipo: "trabalho" },
  { value: "TB2", label: "TB2", tipo: "trabalho" },
];

// Função para verificar se uma data está dentro do semestre
const isDateInSemester = (date, semestre) => {
  const month = date.getMonth() + 1; // getMonth() retorna 0-11
  
  if (semestre === "1") {
    // 1º Semestre: fevereiro (2) até junho (6)
    return month >= 2 && month <= 6;
  } else if (semestre === "2") {
    // 2º Semestre: agosto (8) até novembro (11)
    return month >= 8 && month <= 11;
  }
  
  return false;
};

// Função para encontrar todas as datas de um dia da semana em um intervalo
const getDatesForDayOfWeek = (dayOfWeek, startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate);
  
  // Ajustar para o primeiro dia da semana desejada a partir da data inicial
  const currentDay = current.getDay();
  // Converter dia da semana do sistema (1=segunda) para JS (0=domingo, 1=segunda)
  const dayOfWeekJS = dayOfWeek === 7 ? 0 : dayOfWeek;
  const dayDiff = (dayOfWeekJS - currentDay + 7) % 7;
  current.setDate(current.getDate() + dayDiff);
  
  // Se a data ajustada ainda está antes da data inicial, avançar uma semana
  if (current < startDate) {
    current.setDate(current.getDate() + 7);
  }
  
  // Encontrar todas as ocorrências até a data final
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 7); // Próxima semana
  }
  
  return dates;
};

// Função para formatar data em português
const formatarData = (data) => {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const diaSemana = diasSemana[data.getDay()];
  return `${diaSemana}, ${dia}/${mes}/${ano}`;
};

export function AtividadeForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [turmas, setTurmas] = useState([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState(null);
  const [materiasDaTurma, setMateriasDaTurma] = useState([]);
  const [aulasSemanais, setAulasSemanais] = useState([]);
  const [datasDisponiveis, setDatasDisponiveis] = useState([]);
  const [aulaSelecionada, setAulaSelecionada] = useState(null);
  const [atividadesExistentes, setAtividadesExistentes] = useState([]);

  const [formData, setFormData] = useState({
    tipoAtividade: "", // PV1, PV2, PV3, TB1, TB2
    nome: "",
    descricao: "",
    data: "",
    horarioInicio: "",
    horarioFim: "",
    turmaId: "",
    materiaId: "",
    semestre: "", // "1" ou "2"
  });

  // Buscar turmas ao carregar (apenas turmas que o professor dá aula)
  useEffect(() => {
    const fetchTurmas = async () => {
      if (user?.role === "admin") {
        const result = await turmaService.getAll();
        if (result.success) {
          setTurmas(result.data || []);
        }
      } else if (user?.role === "professor") {
        const result = await turmaService.getMinhasTurmas();
        if (result.success) {
          setTurmas(result.data || []);
        }
      }
    };

    fetchTurmas();
  }, [user]);

  // Buscar dados da turma quando selecionada
  useEffect(() => {
    const fetchTurmaData = async () => {
      if (!formData.turmaId) {
        setTurmaSelecionada(null);
        setMateriasDaTurma([]);
        setFormData((prev) => ({
          ...prev,
          materiaId: "",
          tipoAtividade: "", // Limpar tipo ao mudar turma
        }));
        return;
      }

      const result = await turmaService.getById(formData.turmaId);
      if (result.success) {
        const turma = result.data;
        setTurmaSelecionada(turma);

        // Buscar aulas semanais do professor para esta turma e semestre
        if (formData.semestre) {
          await buscarAulasSemanais(formData.turmaId, formData.semestre);
        }

        // Se não tiver semestre selecionado, não filtrar matérias ainda
        if (!formData.semestre) {
          setMateriasDaTurma([]);
          return;
        }
      }
    };

    fetchTurmaData();
  }, [formData.turmaId, user]);

  // Buscar atividades existentes quando semestre ou turma mudarem (para filtrar datas)
  useEffect(() => {
    const buscarAtividadesExistentes = async () => {
      // Buscar todas as atividades do professor para filtrar datas ocupadas
      if (formData.semestre && formData.turmaId) {
        try {
          const result = await atividadeService.getAll();
          if (result.success) {
            // Filtrar atividades do semestre e turma selecionados (todas as matérias)
            const atividadesFiltradas = (result.data || []).filter((atividade) => {
              const atividadeTurmaId = typeof atividade.turmaId === 'object' ? atividade.turmaId._id : atividade.turmaId;
              
              return atividade.semestre === formData.semestre &&
                     atividadeTurmaId?.toString() === formData.turmaId &&
                     atividade.status === "ativa";
            });
            setAtividadesExistentes(atividadesFiltradas);
          }
        } catch (error) {
          console.error("Erro ao buscar atividades existentes:", error);
          setAtividadesExistentes([]);
        }
      } else {
        setAtividadesExistentes([]);
      }
    };

    buscarAtividadesExistentes();
  }, [formData.semestre, formData.turmaId]);

  // Buscar aulas semanais quando turma ou semestre mudar
  useEffect(() => {
    if (formData.turmaId && formData.semestre) {
      buscarAulasSemanais(formData.turmaId, formData.semestre);
    } else {
      setAulasSemanais([]);
      setDatasDisponiveis([]);
    }
  }, [formData.turmaId, formData.semestre]);

  // Filtrar matérias baseadas nas aulas semanais do professor
  useEffect(() => {
    if (!turmaSelecionada || !formData.semestre) {
      return;
    }

    if (user?.role === "admin") {
      // Admin vê todas as matérias da turma
      const materiasComProfessores = [];
      if (turmaSelecionada.materias && turmaSelecionada.materias.length > 0 && turmaSelecionada.professores && turmaSelecionada.professores.length > 0) {
        for (const materia of turmaSelecionada.materias) {
          const materiaId = typeof materia === 'object' ? materia._id : materia;
          const professorAssociado = turmaSelecionada.professores?.find((prof) => {
            const profObj = typeof prof === 'object' ? prof : null;
            if (!profObj) return false;
            return profObj.materias?.some((m) => {
              const mId = typeof m === 'object' ? m._id : m;
              return mId?.toString() === materiaId?.toString();
            });
          });

          if (professorAssociado) {
            const materiaObj = typeof materia === 'object' ? materia : null;
            materiasComProfessores.push({
              materiaId,
              materiaNome: materiaObj?.nome || materiaId,
              professorId: typeof professorAssociado === 'object' ? professorAssociado._id : professorAssociado,
              professorNome: professorAssociado.userId?.name || "Professor não encontrado",
            });
          }
        }
      }
      setMateriasDaTurma(materiasComProfessores);
    } else if (user?.role === "professor" && aulasSemanais.length > 0) {
      // Professor vê apenas matérias das aulas semanais dele
      const materiasMap = new Map();
      
      aulasSemanais.forEach(aula => {
        const materiaId = typeof aula.materiaId === 'object' ? aula.materiaId._id : aula.materiaId;
        const materiaNome = typeof aula.materiaId === 'object' ? aula.materiaId.nome : "Matéria";
        const professorId = typeof aula.professorId === 'object' ? aula.professorId._id : aula.professorId;
        const professorNome = typeof aula.professorId === 'object' && aula.professorId.userId 
          ? aula.professorId.userId.name 
          : "Professor";

        if (!materiasMap.has(materiaId?.toString())) {
          materiasMap.set(materiaId?.toString(), {
            materiaId,
            materiaNome,
            professorId,
            professorNome,
          });
        }
      });

      const materiasFiltradas = Array.from(materiasMap.values());
      setMateriasDaTurma(materiasFiltradas);
    } else if (user?.role === "professor" && aulasSemanais.length === 0 && formData.turmaId && formData.semestre) {
      // Se não houver aulas semanais, não há matérias disponíveis para o professor
      setMateriasDaTurma([]);
    }
  }, [aulasSemanais, turmaSelecionada, formData.semestre, user]);

  // Filtrar tipos de atividade disponíveis baseado nas atividades já criadas no semestre, turma e matéria
  const tiposDisponiveis = useMemo(() => {
    // Só filtrar se tiver semestre, turma e matéria selecionados
    if (!formData.semestre || !formData.turmaId || !formData.materiaId) {
      return tiposAtividade;
    }

    // Se não houver atividades existentes, todos os tipos estão disponíveis
    if (atividadesExistentes.length === 0) {
      return tiposAtividade;
    }

    // Extrair tipos já usados para esta combinação de semestre + turma + matéria
    const tiposUsados = new Set();
    atividadesExistentes.forEach((atividade) => {
      // Verificar se a atividade tem o campo tipoAtividade
      if (atividade.tipoAtividade) {
        tiposUsados.add(atividade.tipoAtividade);
      }
    });

    // Retornar apenas tipos que ainda não foram usados
    return tiposAtividade.filter((tipo) => !tiposUsados.has(tipo.value));
  }, [formData.semestre, formData.turmaId, formData.materiaId, atividadesExistentes]);

  // Limpar tipoAtividade se não estiver mais disponível
  useEffect(() => {
    if (formData.tipoAtividade && tiposDisponiveis.length > 0) {
      const tipoAindaDisponivel = tiposDisponiveis.some(
        (tipo) => tipo.value === formData.tipoAtividade
      );
      if (!tipoAindaDisponivel) {
        setFormData((prev) => ({
          ...prev,
          tipoAtividade: "",
        }));
      }
    }
  }, [tiposDisponiveis, formData.tipoAtividade]);

  // Gerar datas disponíveis quando aulas semanais ou atividades existentes mudarem
  useEffect(() => {
    if (aulasSemanais.length > 0 && formData.semestre) {
      gerarDatasDisponiveis();
    } else {
      setDatasDisponiveis([]);
    }
  }, [aulasSemanais, formData.semestre, atividadesExistentes]);

  // Atualizar professor e aula quando selecionar matéria
  useEffect(() => {
    if (formData.materiaId && materiasDaTurma.length > 0) {
      const materiaSelecionada = materiasDaTurma.find(
        (m) => m.materiaId?.toString() === formData.materiaId
      );
      
      if (materiaSelecionada) {
        // Não preencher horários ainda - aguardar seleção da data
        setAulaSelecionada(null);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        tipoAtividade: "", // Limpar tipo ao mudar matéria
        horarioInicio: "",
        horarioFim: "",
      }));
      setAulaSelecionada(null);
    }
  }, [formData.materiaId, materiasDaTurma, aulasSemanais]);


  const buscarAulasSemanais = async (turmaId, semestre) => {
    try {
      const result = await aulaSemanalService.getAll();
      if (result.success) {
        const todasAulas = result.data || [];
        
        // Filtrar aulas: mesma turma, mesmo semestre, status ativa
        // Se for professor, também filtrar por professorId
        const aulasFiltradas = todasAulas.filter((aula) => {
          const aulaTurmaId = typeof aula.turmaId === 'object' ? aula.turmaId._id : aula.turmaId;
          return aulaTurmaId?.toString() === turmaId &&
                 aula.semestre === semestre &&
                 aula.status === "ativa";
        });

        setAulasSemanais(aulasFiltradas);
      }
    } catch (error) {
      console.error("Erro ao buscar aulas semanais:", error);
      setAulasSemanais([]);
    }
  };

  const gerarDatasDisponiveis = () => {
    if (!formData.semestre || aulasSemanais.length === 0) {
      setDatasDisponiveis([]);
      return;
    }

    const now = new Date();
    // Normalizar para início do dia para comparação correta
    now.setHours(0, 0, 0, 0);
    const currentYear = now.getFullYear();
    
    // Definir intervalo baseado no semestre
    let startDate, endDate;
    if (formData.semestre === "1") {
      // 1º Semestre: fevereiro até junho
      startDate = new Date(currentYear, 1, 1); // 1 de fevereiro
      endDate = new Date(currentYear, 5, 30); // 30 de junho
    } else {
      // 2º Semestre: agosto até novembro
      startDate = new Date(currentYear, 7, 1); // 1 de agosto
      endDate = new Date(currentYear, 10, 30); // 30 de novembro
    }

    // Criar um Set com datas que já têm atividades do professor
    const datasOcupadas = new Set();
    atividadesExistentes.forEach((atividade) => {
      if (atividade.data) {
        const dataAtividade = new Date(atividade.data);
        // Normalizar para início do dia
        dataAtividade.setHours(0, 0, 0, 0);
        const dataStr = dataAtividade.toISOString().split('T')[0];
        // Adicionar data e horário como chave única
        const chave = `${dataStr}_${atividade.horarioInicio}_${atividade.horarioFim}`;
        datasOcupadas.add(chave);
      }
    });

    // Agrupar aulas por dia da semana
    const aulasPorDia = {};
    aulasSemanais.forEach((aula) => {
      if (!aulasPorDia[aula.diaSemana]) {
        aulasPorDia[aula.diaSemana] = [];
      }
      aulasPorDia[aula.diaSemana].push(aula);
    });

    // Gerar todas as datas para cada dia da semana que tem aula
    const todasDatas = [];
    Object.keys(aulasPorDia).forEach((diaSemana) => {
      const diaSemanaNum = parseInt(diaSemana);
      const datasDoDia = getDatesForDayOfWeek(diaSemanaNum, startDate, endDate);
      
      // Adicionar informações da aula para cada data
      datasDoDia.forEach((data) => {
        // Normalizar data para início do dia para comparação
        const dataNormalizada = new Date(data);
        dataNormalizada.setHours(0, 0, 0, 0);
        
        // Verificar se a data está realmente no semestre
        if (isDateInSemester(data, formData.semestre)) {
          // Filtrar datas passadas - só incluir datas futuras ou hoje
          if (dataNormalizada >= now) {
            aulasPorDia[diaSemana].forEach((aula) => {
              // Verificar se esta data/horário já tem atividade do professor
              const dataStr = dataNormalizada.toISOString().split('T')[0];
              const chave = `${dataStr}_${aula.horarioInicio}_${aula.horarioFim}`;
              
              // Só adicionar se não estiver ocupada
              if (!datasOcupadas.has(chave)) {
                todasDatas.push({
                  data: new Date(data),
                  aula,
                  diaSemana: diaSemanaNum,
                });
              }
            });
          }
        }
      });
    });

    // Ordenar por data
    todasDatas.sort((a, b) => a.data.getTime() - b.data.getTime());

    setDatasDisponiveis(todasDatas);
  };

  // Validar formulário
  const validarFormulario = () => {
    // Validar campos obrigatórios
    if (!formData.tipoAtividade) {
      showErrorToast("❌ Selecione o tipo da atividade");
      return false;
    }

    if (!formData.nome || !formData.nome.trim()) {
      showErrorToast("❌ Nome não pode ser vazio");
      return false;
    }

    if (!formData.semestre) {
      showErrorToast("❌ Selecione um semestre");
      return false;
    }

    if (!formData.turmaId) {
      showErrorToast("❌ Selecione uma turma");
      return false;
    }

    if (!formData.materiaId) {
      showErrorToast("❌ Selecione uma matéria");
      return false;
    }

    if (!formData.data) {
      showErrorToast("❌ Selecione uma data");
      return false;
    }

    // Os horários são extraídos automaticamente do campo data, então se a data está selecionada, os horários devem estar preenchidos
    if (!formData.horarioInicio || !formData.horarioFim) {
      showErrorToast("❌ Selecione uma data válida");
      return false;
    }

    // Validar que horário de fim não pode ser menor ou igual ao de início
    const inicio = formData.horarioInicio.split(":").map(Number);
    const fim = formData.horarioFim.split(":").map(Number);
    const inicioMinutos = inicio[0] * 60 + inicio[1];
    const fimMinutos = fim[0] * 60 + fim[1];

    if (fimMinutos <= inicioMinutos) {
      showErrorToast("❌ O horário de fim não pode ser menor ou igual ao horário de início");
      return false;
    }

    // Validar que os horários foram preenchidos
    // Como a data vem do dropdown que só mostra aulas válidas do professor logado,
    // e os horários são extraídos automaticamente quando a data é selecionada,
    // basta verificar se os horários foram preenchidos corretamente
    if (!formData.horarioInicio || !formData.horarioFim) {
      showErrorToast("❌ Selecione uma data válida");
      return false;
    }

    return true;
  };

  // Submeter formulário
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setLoading(true);

    try {
      // Encontrar o tipo baseado no tipoAtividade selecionado
      const tipoAtividadeSelecionado = tiposAtividade.find(
        (t) => t.value === formData.tipoAtividade
      );
      const tipo = tipoAtividadeSelecionado?.tipo || "prova";

      // Criar data combinando data e horário
      const dataCompleta = new Date(`${formData.data}T${formData.horarioInicio}:00`);

      const atividadeData = {
        nome: formData.nome.trim(),
        tipo, // "prova" ou "trabalho"
        tipoAtividade: formData.tipoAtividade, // PV1, PV2, PV3, TB1, TB2
        data: dataCompleta.toISOString(),
        horarioInicio: formData.horarioInicio,
        horarioFim: formData.horarioFim,
        materiaId: formData.materiaId,
        turmaId: formData.turmaId,
        semestre: formData.semestre,
      };

      const result = await atividadeService.create(atividadeData);

      if (!result.success) {
        const errorMessage = result.error || "Erro ao criar atividade";
        showErrorToast(`❌ ${errorMessage}`);
        setLoading(false);
        return;
      }

      showSuccessToast("✅ Atividade criada com sucesso!");
      navigate("/aulas");
    } catch (error) {
      showErrorToast(error.message || "Erro ao criar atividade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <PageHeader title="Cadastrar Atividade" />

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="Digite o nome da atividade"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>
          <textarea
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            placeholder="Digite a descrição da atividade"
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Semestre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Semestre <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.semestre}
            onChange={(e) => {
              setFormData({ 
                ...formData, 
                semestre: e.target.value,
                tipoAtividade: "", // Limpar tipo ao mudar semestre
                turmaId: "",
                materiaId: "",
                data: "",
                horarioInicio: "",
                horarioFim: "",
              });
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          >
            <option value="">Selecione um semestre</option>
            <option value="1">1º Semestre</option>
            <option value="2">2º Semestre</option>
          </select>
        </div>

        {/* Turma */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Turma <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.turmaId}
            onChange={(e) => {
              setFormData({
                ...formData,
                turmaId: e.target.value,
                materiaId: "",
                data: "",
                horarioInicio: "",
                horarioFim: "",
              });
            }}
            disabled={!formData.semestre}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          >
            <option value="">Selecione uma turma</option>
            {turmas.map((turma) => (
              <option key={turma._id} value={turma._id}>
                {turma.nome} {turma.anoLetivo || ""}
              </option>
            ))}
          </select>
        </div>

        {/* Matéria - só aparece quando turma está selecionada */}
        {formData.turmaId && formData.semestre && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Matéria <span className="text-red-500">*</span>
            </label>
            {materiasDaTurma.length === 0 ? (
              <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Nenhuma matéria disponível para esta turma e semestre
              </div>
            ) : (
              <select
                value={formData.materiaId}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  materiaId: e.target.value,
                  data: "",
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                <option value="">Selecione uma matéria</option>
                {materiasDaTurma.map((materia) => (
                  <option key={materia.materiaId} value={materia.materiaId}>
                    {materia.materiaNome}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Tipo de Atividade - só aparece quando matéria está selecionada */}
        {formData.materiaId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo da Atividade <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.tipoAtividade}
              onChange={(e) => setFormData({ ...formData, tipoAtividade: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
              disabled={tiposDisponiveis.length === 0 && formData.semestre && formData.turmaId && formData.materiaId}
            >
              <option value="">Selecione o tipo da atividade</option>
              {tiposDisponiveis.length === 0 && formData.semestre && formData.turmaId && formData.materiaId ? (
                <option value="" disabled>
                  Todos os tipos de atividade já foram criados para esta turma e matéria neste semestre
                </option>
              ) : (
                tiposDisponiveis.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        {/* Data - só aparece quando matéria está selecionada */}
        {formData.materiaId && datasDisponiveis.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.data}
              onChange={(e) => {
                const dataSelecionada = e.target.value;
                if (dataSelecionada) {
                  // Encontrar o item correspondente à data selecionada
                  const itemSelecionado = datasDisponiveis.find(item => {
                    const dataStr = item.data.toISOString().split('T')[0];
                    const materiaId = typeof item.aula.materiaId === 'object' 
                      ? item.aula.materiaId._id 
                      : item.aula.materiaId;
                    return dataStr === dataSelecionada &&
                           materiaId?.toString() === formData.materiaId;
                  });

                  if (itemSelecionado) {
                    // Extrair horários diretamente da aula selecionada
                    setFormData({
                      ...formData,
                      data: dataSelecionada,
                      horarioInicio: itemSelecionado.aula.horarioInicio,
                      horarioFim: itemSelecionado.aula.horarioFim,
                    });
                    setAulaSelecionada(itemSelecionado.aula);
                  }
                } else {
                  setFormData({
                    ...formData,
                    data: "",
                    horarioInicio: "",
                    horarioFim: "",
                  });
                  setAulaSelecionada(null);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            >
              <option value="">Selecione uma data</option>
              {datasDisponiveis
                .filter(item => {
                  const materiaId = typeof item.aula.materiaId === 'object' 
                    ? item.aula.materiaId._id 
                    : item.aula.materiaId;
                  return materiaId?.toString() === formData.materiaId;
                })
                .map((item, index) => {
                  const dataStr = item.data.toISOString().split('T')[0];
                  return (
                    <option key={`${dataStr}-${index}`} value={dataStr}>
                      {formatarData(item.data)} - {item.aula.horarioInicio} às {item.aula.horarioFim}
                    </option>
                  );
                })}
            </select>
          </div>
        )}

        {/* Botões */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/aulas")}
            className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}
