import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { PageHeader } from "../../components/ui/PageHeader";
import { showSuccessToast, showErrorToast, showWarningToast } from "../../components/feedback/toastConfig";
import aulaSemanalService from "../../services/aulaSemanal.service";
import turmaService from "../../services/turma.service";
import materiaService from "../../services/materia.service";

// Mapeamento de dias da semana
const diasSemana = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
];

export function AulaForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [turmas, setTurmas] = useState([]);
  const [aulasExistentes, setAulasExistentes] = useState([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState(null);
  const [materiasDaTurma, setMateriasDaTurma] = useState([]);
  const [professorDaMateria, setProfessorDaMateria] = useState(null);
  const [searchDia, setSearchDia] = useState("");
  const [showDiaDropdown, setShowDiaDropdown] = useState(false);

  const [formData, setFormData] = useState({
    diasHorarios: [], // Array de { diaSemana, diaLabel, horarioInicio, horarioFim }
    turmaId: "",
    materiaId: "",
    professorId: "",
    semestre: "", // "1" ou "2"
  });

  // Buscar turmas e aulas existentes ao carregar
  useEffect(() => {
    const fetchData = async () => {
      const [turmasResult, aulasResult] = await Promise.all([
        turmaService.getAll(),
        aulaSemanalService.getAll(),
      ]);

      if (turmasResult.success) {
        setTurmas(turmasResult.data || []);
      }

      if (aulasResult.success) {
        setAulasExistentes(aulasResult.data || []);
      }
    };

    fetchData();
  }, []);

  // Buscar dados da turma quando selecionada
  useEffect(() => {
    const fetchTurmaData = async () => {
      if (!formData.turmaId) {
        setTurmaSelecionada(null);
        setMateriasDaTurma([]);
        setFormData((prev) => ({
          ...prev,
          materiaId: "",
          professorId: "",
        }));
        return;
      }

      const result = await turmaService.getById(formData.turmaId);
      if (result.success) {
        const turma = result.data;
        setTurmaSelecionada(turma);

        // Buscar matérias da turma com seus professores associados
        const materiasComProfessores = [];
        if (turma.materias && turma.materias.length > 0) {
          // Para cada matéria da turma, encontrar o professor associado
          for (const materia of turma.materias) {
            const materiaId = typeof materia === 'object' ? materia._id : materia;
            const materiaObj = typeof materia === 'object' ? materia : null;
            const materiaNome = materiaObj?.nome || materiaId;

            // Primeiro, tentar encontrar o professor que leciona esta matéria E está na turma
            let professorAssociado = turma.professores?.find((prof) => {
              const profObj = typeof prof === 'object' ? prof : null;
              if (!profObj) return false;
              // Verificar se o professor leciona essa matéria
              return profObj.materias?.some((m) => {
                const mId = typeof m === 'object' ? m._id : m;
                return mId?.toString() === materiaId?.toString();
              });
            });

            // Se não encontrou professor na turma, buscar professores que lecionem essa matéria via API
            if (!professorAssociado) {
              try {
                const materiaResult = await materiaService.getById(materiaId);
                if (materiaResult.success && materiaResult.data?.professores && materiaResult.data.professores.length > 0) {
                  // Pegar o primeiro professor que leciona essa matéria
                  // A API retorna Teacher com _id e userId populado
                  const primeiroProfessor = materiaResult.data.professores[0];
                  if (primeiroProfessor && primeiroProfessor._id) {
                    professorAssociado = {
                      _id: primeiroProfessor._id, // Este é o Teacher._id que precisamos
                      userId: primeiroProfessor.userId, // User populado com name
                    };
                  }
                }
              } catch (error) {
                console.error(`Erro ao buscar professores da matéria ${materiaNome}:`, error);
              }
            }

            // Adicionar a matéria mesmo se não tiver professor associado
            // O professor pode ser selecionado depois ou pode não estar cadastrado ainda
            materiasComProfessores.push({
              materiaId,
              materiaNome,
              professorId: professorAssociado 
                ? (typeof professorAssociado === 'object' ? professorAssociado._id : professorAssociado)
                : null,
              professorNome: professorAssociado?.userId?.name || null,
            });
          }
        }

        setMateriasDaTurma(materiasComProfessores);
      }
    };

    fetchTurmaData();
  }, [formData.turmaId]);

  // Atualizar professor quando selecionar matéria
  useEffect(() => {
    if (formData.materiaId && materiasDaTurma.length > 0) {
      const materiaSelecionada = materiasDaTurma.find(
        (m) => m.materiaId?.toString() === formData.materiaId
      );
      
      if (materiaSelecionada) {
        setFormData((prev) => ({
          ...prev,
          professorId: materiaSelecionada.professorId || "",
        }));
        // Só definir professor se existir
        if (materiaSelecionada.professorId && materiaSelecionada.professorNome) {
          setProfessorDaMateria(materiaSelecionada);
        } else {
          setProfessorDaMateria(null);
        }
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        professorId: "",
      }));
      setProfessorDaMateria(null);
    }
  }, [formData.materiaId, materiasDaTurma]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDiaDropdown && !event.target.closest(".dia-dropdown")) {
        setShowDiaDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDiaDropdown]);

  // Filtrar dias disponíveis (excluir os já selecionados)
  const diasDisponiveis = diasSemana.filter((dia) => {
    const diaJaSelecionado = formData.diasHorarios.some(
      (dh) => dh.diaSemana === dia.value
    );
    return !diaJaSelecionado && dia.label.toLowerCase().includes(searchDia.toLowerCase());
  });

  // Selecionar dia da semana
  const selecionarDia = (dia) => {
    setFormData({
      ...formData,
      diasHorarios: [
        ...formData.diasHorarios,
        {
          diaSemana: dia.value,
          diaLabel: dia.label,
          horarioInicio: "",
          horarioFim: "",
        },
      ],
    });
    setSearchDia("");
    setShowDiaDropdown(false);
  };

  // Remover dia selecionado
  const removerDiaHorario = (diaSemana) => {
    setFormData({
      ...formData,
      diasHorarios: formData.diasHorarios.filter((dh) => dh.diaSemana !== diaSemana),
    });
  };

  // Atualizar horário de um dia específico
  const atualizarHorario = (diaSemana, campo, valor) => {
    setFormData({
      ...formData,
      diasHorarios: formData.diasHorarios.map((dh) =>
        dh.diaSemana === diaSemana ? { ...dh, [campo]: valor } : dh
      ),
    });
  };

  // Validar formulário
  const validarFormulario = () => {
    // Verificar se todos os campos estão vazios
    const todosCamposVazios =
      formData.diasHorarios.length === 0 &&
      !formData.turmaId &&
      !formData.materiaId &&
      !formData.professorId;

    if (todosCamposVazios) {
      showErrorToast("❌ Todos os campos é obrigatório");
      return false;
    }

    // Verificar se pelo menos um dia da semana foi selecionado
    if (formData.diasHorarios.length === 0) {
      showWarningToast("⚠️ Selecione pelo menos 1 dia da semana");
      return false;
    }

    // Verificar se o semestre foi selecionado
    if (!formData.semestre) {
      showErrorToast("❌ Selecione um semestre");
      return false;
    }

    // Verificar campos obrigatórios
    if (!formData.turmaId) {
      showErrorToast("❌ Todos os campos é obrigatório");
      return false;
    }
    if (!formData.materiaId) {
      showErrorToast("❌ Todos os campos é obrigatório");
      return false;
    }
    if (!formData.professorId) {
      showErrorToast("❌ Professor não encontrado para esta matéria");
      return false;
    }

    // Validar cada dia selecionado
    for (const diaHorario of formData.diasHorarios) {
      // Verificar se horários foram preenchidos
      if (!diaHorario.horarioInicio || !diaHorario.horarioFim) {
        showErrorToast(`❌ Preencha os horários para ${diaHorario.diaLabel}`);
        return false;
      }

      // Validar que horário de fim não pode ser menor ou igual ao de início
      const inicio = diaHorario.horarioInicio.split(":").map(Number);
      const fim = diaHorario.horarioFim.split(":").map(Number);
      const inicioMinutos = inicio[0] * 60 + inicio[1];
      const fimMinutos = fim[0] * 60 + fim[1];

      if (fimMinutos <= inicioMinutos) {
        showErrorToast(`❌ O horario fim de ${diaHorario.diaLabel} não pode ser menor ou igual ao horario de inicio`);
        return false;
      }

      // Validar conflito: mesma turma + mesma matéria + mesmo dia + mesmo horário + mesmo semestre
      if (formData.turmaId && formData.materiaId && formData.semestre) {
        const inicioNovo = inicioMinutos;
        const fimNovo = fimMinutos;

        // Buscar aulas existentes com conflito exato
        const aulasConflitantes = aulasExistentes.filter((aula) => {
          // Verificar se é da mesma turma
          const aulaTurmaId = typeof aula.turmaId === 'object' && aula.turmaId !== null
            ? aula.turmaId._id?.toString()
            : aula.turmaId?.toString();
          
          if (aulaTurmaId !== formData.turmaId) {
            return false;
          }

          // Verificar se é da mesma matéria
          const aulaMateriaId = typeof aula.materiaId === 'object' && aula.materiaId !== null
            ? aula.materiaId._id?.toString()
            : aula.materiaId?.toString();
          
          if (aulaMateriaId !== formData.materiaId) {
            return false;
          }

          // Verificar se é do mesmo dia da semana
          if (aula.diaSemana !== diaHorario.diaSemana) {
            return false;
          }

          // Verificar se é do mesmo semestre
          if (aula.semestre !== formData.semestre) {
            return false;
          }

          // Verificar se o status é ativa
          if (aula.status !== "ativa") {
            return false;
          }

          // Verificar conflito de horário (sobreposição)
          const inicioExistente = aula.horarioInicio.split(":").map(Number);
          const fimExistente = aula.horarioFim.split(":").map(Number);
          const inicioExistenteMinutos = inicioExistente[0] * 60 + inicioExistente[1];
          const fimExistenteMinutos = fimExistente[0] * 60 + fimExistente[1];

          // Verificar se há sobreposição: início novo < fim existente E fim novo > início existente
          if (inicioNovo < fimExistenteMinutos && fimNovo > inicioExistenteMinutos) {
            return true;
          }

          return false;
        });

        // Se encontrou conflito, mostrar aviso
        if (aulasConflitantes.length > 0) {
          showWarningToast(
            `⚠️ Já existe uma aula cadastrada nesse horario na ${diaHorario.diaLabel}`
          );
          return false;
        }
      }
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
      // Criar uma aula para cada dia da semana selecionado
      const promises = formData.diasHorarios.map((diaHorario) =>
        aulaSemanalService.create({
          diaSemana: diaHorario.diaSemana,
          horarioInicio: diaHorario.horarioInicio,
          horarioFim: diaHorario.horarioFim,
          turmaId: formData.turmaId,
          materiaId: formData.materiaId,
          professorId: formData.professorId,
          semestre: formData.semestre,
        })
      );

      const results = await Promise.all(promises);

      // Verificar se todas as aulas foram criadas com sucesso
      const todasSucesso = results.every((result) => result.success);
      
      if (!todasSucesso) {
        const primeiroErro = results.find((result) => !result.success);
        const errorMessage = primeiroErro?.error || "Erro ao criar aulas";
        showErrorToast(`❌ ${errorMessage}`);
        setLoading(false);
        return;
      }

      showSuccessToast(`✅ ${results.length} aula(s) criada(s) com sucesso!`);
      navigate("/aulas");
    } catch (error) {
      showErrorToast(error.message || "Erro ao criar aulas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <PageHeader title="Cadastrar Aula Semanal" />

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Semestre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Semestre <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.semestre}
            onChange={(e) => setFormData({ ...formData, semestre: e.target.value })}
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
                professorId: "",
              });
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
        {formData.turmaId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Matéria <span className="text-red-500">*</span>
            </label>
            {materiasDaTurma.length === 0 ? (
              <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Nenhuma matéria disponível para esta turma ou todas as matérias já estão registradas
              </div>
            ) : (
              <select
                value={formData.materiaId}
                onChange={(e) => setFormData({ ...formData, materiaId: e.target.value })}
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

        {/* Professor - só aparece quando matéria está selecionada */}
        {formData.materiaId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Professor
            </label>
            {professorDaMateria && professorDaMateria.professorNome ? (
              <input
                type="text"
                value={professorDaMateria.professorNome}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
              />
            ) : (
              <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Nenhum professor associado a esta matéria nesta turma
              </div>
            )}
          </div>
        )}

        {/* Dias da Semana e Horários */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dias da Semana e Horários <span className="text-red-500">*</span>
          </label>

          {/* Lista de dias com horários */}
          {formData.diasHorarios.length > 0 && (
            <div className="space-y-3 mb-4">
              {formData.diasHorarios.map((diaHorario, index) => (
                <div
                  key={`${diaHorario.diaSemana}-${index}`}
                  className="bg-gray-100 border border-gray-200 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 relative"
                >
                  {/* Botão X - Posicionado no topo à direita em mobile/tablet, normal em desktop */}
                  <button
                    type="button"
                    onClick={() => removerDiaHorario(diaHorario.diaSemana)}
                    className="absolute top-2 right-2 sm:relative sm:top-auto sm:right-auto text-gray-500 hover:text-red-600 transition-colors shrink-0 sm:mt-0"
                    title="Remover dia"
                  >
                    <FiX size={20} />
                  </button>
                  <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full pr-8 sm:pr-0">
                    {/* Nome do Dia */}
                    <div className="flex-1">
                      <span className="text-xs sm:text-sm text-orange-500 font-medium block mb-1">Dia da Semana</span>
                      <div className="bg-gray-50 border border-orange-500 rounded px-3 py-2 text-sm">
                        {diaHorario.diaLabel}
                      </div>
                    </div>
                    {/* Horário de Início */}
                    <div className="flex-1">
                      <span className="text-xs sm:text-sm text-orange-500 font-medium block mb-1">Horário de Início</span>
                      <input
                        type="time"
                        value={diaHorario.horarioInicio}
                        onChange={(e) => atualizarHorario(diaHorario.diaSemana, "horarioInicio", e.target.value)}
                        className="w-full bg-gray-50 border border-orange-500 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    {/* Horário de Fim */}
                    <div className="flex-1">
                      <span className="text-xs sm:text-sm text-orange-500 font-medium block mb-1">Horário de Fim</span>
                      <input
                        type="time"
                        value={diaHorario.horarioFim}
                        onChange={(e) => atualizarHorario(diaHorario.diaSemana, "horarioFim", e.target.value)}
                        className="w-full bg-gray-50 border border-orange-500 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Adicionar novo dia */}
          {formData.diasHorarios.length < diasSemana.length && (
            <div className="relative dia-dropdown">
              <input
                type="text"
                value={searchDia}
                onChange={(e) => {
                  setSearchDia(e.target.value);
                  setShowDiaDropdown(true);
                }}
                onFocus={() => setShowDiaDropdown(true)}
                placeholder="Buscar dia da semana para adicionar..."
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              />
              {showDiaDropdown && diasDisponiveis.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {diasDisponiveis.map((dia) => (
                    <div
                      key={dia.value}
                      onClick={() => selecionarDia(dia)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {dia.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

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
