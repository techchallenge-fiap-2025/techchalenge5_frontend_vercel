import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiSearch, FiX } from "react-icons/fi";
import { PageHeader } from "../../components/ui/PageHeader";
import { showSuccessToast, showErrorToast, showWarningToast } from "../../components/feedback/toastConfig";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import turmaService from "../../services/turma.service";
import alunoService from "../../services/aluno.service";
import materiaService from "../../services/materia.service";
import professorService from "../../services/professor.service";
import aulaSemanalService from "../../services/aulaSemanal.service";

export function TurmaEditForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [alunos, setAlunos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [aulasExistentes, setAulasExistentes] = useState([]);
  const [searchAluno, setSearchAluno] = useState("");
  const [searchMateria, setSearchMateria] = useState("");
  const [showAlunoDropdown, setShowAlunoDropdown] = useState(false);
  const [showMateriaDropdown, setShowMateriaDropdown] = useState(false);

  const [formData, setFormData] = useState({
    ano: "",
    letra: "",
    periodo: "",
    nivelEducacional: "",
    alunosIds: [],
    materiasProfessores: [], // Array de objetos { materiaId, professorId }
  });

  const [initialData, setInitialData] = useState(null);

  // Buscar dados iniciais
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const [turmaResult, alunosResult, materiasResult, professoresResult, aulasResult] = await Promise.all([
          turmaService.getById(id),
          alunoService.getAll(),
          materiaService.getAll(),
          professorService.getAll(),
          aulaSemanalService.getAll(),
        ]);

        if (!turmaResult.success) {
          showErrorToast("Erro ao carregar dados da turma");
          navigate("/turmas");
          return;
        }

        const turma = turmaResult.data;

        // Extrair ano e letra do nome (ex: "1º Ano A" -> ano: "1", letra: "A")
        const nomeMatch = turma.nome?.match(/(\d+)º Ano ([A-Z])/);
        const ano = nomeMatch ? nomeMatch[1] : "";
        const letra = nomeMatch ? nomeMatch[2] : "";

        // Criar pares matéria-professor
        // Como não temos essa relação direta no modelo, vamos criar pares baseados nas matérias e professores da turma
        // Se uma matéria não tiver professor associado, deixaremos o professorId como null
        const materiasProfessores = [];
        if (turma.materias && Array.isArray(turma.materias)) {
          turma.materias.forEach((materia) => {
            const materiaId = typeof materia === 'object' ? materia._id : materia;
            // Tentar encontrar um professor que lecione essa matéria e esteja na turma
            const professorAssociado = turma.professores?.find((prof) => {
              const profObj = typeof prof === 'object' ? prof : null;
              if (!profObj) return false;
              // Verificar se o professor leciona essa matéria
              return profObj.materias?.some((m) => {
                const mId = typeof m === 'object' ? m._id : m;
                return mId?.toString() === materiaId?.toString();
              });
            });
            const professorId = professorAssociado 
              ? (typeof professorAssociado === 'object' ? professorAssociado._id : professorAssociado)
              : null;
            materiasProfessores.push({ materiaId, professorId });
          });
        }

        const initialFormData = {
          ano,
          letra,
          periodo: turma.periodo || "",
          nivelEducacional: turma.nivelEducacional || "",
          alunosIds: turma.alunos?.map((aluno) => 
            typeof aluno === 'object' ? aluno._id : aluno
          ) || [],
          materiasProfessores,
        };

        setFormData(initialFormData);
        setInitialData(initialFormData);

        if (alunosResult.success) {
          setAlunos(alunosResult.data || []);
        }
        if (materiasResult.success) {
          setMaterias(materiasResult.data || []);
        }
        if (professoresResult.success) {
          setProfessores(professoresResult.data || []);
        }
        if (aulasResult.success) {
          setAulasExistentes(aulasResult.data || []);
        }
      } catch (error) {
        showErrorToast("Erro ao carregar dados");
        navigate("/turmas");
      } finally {
        setIsLoadingData(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, navigate]);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAlunoDropdown && !event.target.closest(".aluno-dropdown")) {
        setShowAlunoDropdown(false);
      }
      if (showMateriaDropdown && !event.target.closest(".materia-dropdown")) {
        setShowMateriaDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAlunoDropdown, showMateriaDropdown]);

  // Filtrar alunos (excluir os já selecionados)
  const alunosFiltrados = alunos.filter((aluno) => {
    const nomeMatch = (aluno.userId?.name || "").toLowerCase().includes(searchAluno.toLowerCase());
    const naoSelecionado = !formData.alunosIds.includes(aluno._id);
    return nomeMatch && naoSelecionado;
  });

  // Filtrar matérias (excluir as já selecionadas)
  const materiasFiltradas = materias.filter((materia) => {
    const nomeMatch = (materia.nome || "").toLowerCase().includes(searchMateria.toLowerCase());
    const jaSelecionada = formData.materiasProfessores.some(
      (mp) => mp.materiaId?.toString() === materia._id?.toString()
    );
    return nomeMatch && !jaSelecionada;
  });

  // Obter professores de uma matéria específica
  const getProfessoresPorMateria = (materiaId) => {
    if (!materiaId) return [];
    
    return professores.filter((professor) => {
      // Verificar se o professor leciona a matéria
      return professor.materias?.some((m) => {
        const mId = typeof m === 'object' ? m._id : m;
        return mId?.toString() === materiaId?.toString();
      });
    });
  };

  // Selecionar aluno
  const selecionarAluno = (aluno) => {
    setFormData({
      ...formData,
      alunosIds: [...formData.alunosIds, aluno._id],
    });
    setSearchAluno("");
    setShowAlunoDropdown(false);
  };

  // Remover aluno selecionado
  const removerAluno = (alunoId) => {
    setFormData({
      ...formData,
      alunosIds: formData.alunosIds.filter((id) => id !== alunoId),
    });
  };

  // Selecionar matéria (cria imediatamente um par com professorId null)
  const selecionarMateria = (materia) => {
    // Verificar se a matéria já não está selecionada
    const jaExiste = formData.materiasProfessores.some(
      (mp) => mp.materiaId?.toString() === materia._id?.toString()
    );
    
    if (jaExiste) {
      showWarningToast("⚠️ Esta matéria já foi adicionada");
      return;
    }

    // Adicionar novo par matéria-professor (sem professor ainda)
    setFormData({
      ...formData,
      materiasProfessores: [
        ...formData.materiasProfessores,
        {
          materiaId: materia._id,
          professorId: null,
        },
      ],
    });

    setSearchMateria("");
    setShowMateriaDropdown(false);
  };

  // Atualizar professor de um par matéria-professor
  const atualizarProfessor = async (materiaId, professorId) => {
    // Se está tentando remover o professor (setar para null), verificar se há aulas
    if (!professorId) {
      const parAtual = formData.materiasProfessores.find(
        (mp) => mp.materiaId?.toString() === materiaId?.toString()
      );
      
      // Se havia um professor antes e está tentando remover
      if (parAtual?.professorId) {
        // Verificar se há aulas cadastradas usando este professor nesta turma
        const aulasComEsteProfessor = aulasExistentes.filter((aula) => {
          const aulaTurmaId = typeof aula.turmaId === 'object' && aula.turmaId !== null
            ? aula.turmaId._id?.toString()
            : aula.turmaId?.toString();
          
          const aulaProfessorId = typeof aula.professorId === 'object' && aula.professorId !== null
            ? aula.professorId._id?.toString()
            : aula.professorId?.toString();
          
          return aulaTurmaId === id && aulaProfessorId === parAtual.professorId?.toString() && aula.status === "ativa";
        });

        if (aulasComEsteProfessor.length > 0) {
          showWarningToast("⚠️ Este professor tem uma aula cadastrada, caso queira que ele seja retirado dessa turma delete a aula primeiro");
          return;
        }
      }
    }

    setFormData({
      ...formData,
      materiasProfessores: formData.materiasProfessores.map((mp) =>
        mp.materiaId?.toString() === materiaId?.toString()
          ? { ...mp, professorId: professorId || null }
          : mp
      ),
    });
  };

  // Remover par matéria-professor
  const removerMateriaProfessor = async (materiaId) => {
    // Verificar se há aulas cadastradas usando esta matéria nesta turma
    const aulasComEstaMateria = aulasExistentes.filter((aula) => {
      const aulaTurmaId = typeof aula.turmaId === 'object' && aula.turmaId !== null
        ? aula.turmaId._id?.toString()
        : aula.turmaId?.toString();
      
      const aulaMateriaId = typeof aula.materiaId === 'object' && aula.materiaId !== null
        ? aula.materiaId._id?.toString()
        : aula.materiaId?.toString();
      
      return aulaTurmaId === id && aulaMateriaId === materiaId?.toString() && aula.status === "ativa";
    });

    if (aulasComEstaMateria.length > 0) {
      showWarningToast("⚠️ Esta matéria tem uma aula cadastrada, caso queira que ela seja retirada dessa turma delete a aula primeiro");
      return;
    }

    setFormData({
      ...formData,
      materiasProfessores: formData.materiasProfessores.filter(
        (mp) => mp.materiaId?.toString() !== materiaId?.toString()
      ),
    });
  };

  // Obter alunos selecionados
  const alunosSelecionados = alunos.filter((aluno) =>
    formData.alunosIds.includes(aluno._id)
  );

  // Obter dados completos dos pares matéria-professor
  const materiasProfessoresCompletos = formData.materiasProfessores.map((mp) => {
    const materia = materias.find((m) => m._id?.toString() === mp.materiaId?.toString());
    const professor = mp.professorId
      ? professores.find((p) => p._id?.toString() === mp.professorId?.toString())
      : null;
    const professoresDisponiveis = getProfessoresPorMateria(mp.materiaId);
    return {
      materiaId: mp.materiaId,
      professorId: mp.professorId,
      materiaNome: materia?.nome || "Matéria não encontrada",
      professorNome: professor?.userId?.name || null,
      professoresDisponiveis,
    };
  });

  // Verificar se houve mudanças
  const hasChanges = useMemo(() => {
    if (!initialData) return false;
    
    // Comparar campos básicos
    if (
      formData.ano !== initialData.ano ||
      formData.letra !== initialData.letra ||
      formData.periodo !== initialData.periodo ||
      formData.nivelEducacional !== initialData.nivelEducacional
    ) {
      return true;
    }

    // Comparar arrays de alunos
    if (formData.alunosIds.length !== initialData.alunosIds.length) {
      return true;
    }
    const alunosChanged = formData.alunosIds.some(
      (id) => !initialData.alunosIds.includes(id)
    ) || initialData.alunosIds.some(
      (id) => !formData.alunosIds.includes(id)
    );
    if (alunosChanged) {
      return true;
    }

    // Comparar pares matéria-professor
    if (formData.materiasProfessores.length !== initialData.materiasProfessores.length) {
      return true;
    }
    const materiasProfessoresChanged = formData.materiasProfessores.some(
      (mp) => {
        const initialMp = initialData.materiasProfessores.find(
          (imp) => imp.materiaId?.toString() === mp.materiaId?.toString()
        );
        return !initialMp || initialMp.professorId?.toString() !== mp.professorId?.toString();
      }
    ) || initialData.materiasProfessores.some(
      (imp) => {
        const currentMp = formData.materiasProfessores.find(
          (mp) => mp.materiaId?.toString() === imp.materiaId?.toString()
        );
        return !currentMp || currentMp.professorId?.toString() !== imp.professorId?.toString();
      }
    );
    if (materiasProfessoresChanged) {
      return true;
    }

    return false;
  }, [formData, initialData]);

  // Validar formulário
  const validarFormulario = () => {
    if (!formData.ano || !formData.letra || !formData.periodo || !formData.nivelEducacional) {
      showErrorToast("❌ Todos os campos são obrigatórios");
      return false;
    }

    // Validar que todas as matérias têm professor selecionado
    const materiasSemProfessor = formData.materiasProfessores.filter(
      (mp) => mp.materiaId && !mp.professorId
    );
    
    if (materiasSemProfessor.length > 0) {
      const materiasNomes = materiasSemProfessor.map((mp) => {
        const materia = materias.find((m) => m._id?.toString() === mp.materiaId?.toString());
        return materia?.nome || "Matéria";
      });
      showErrorToast(`❌ Selecione um professor para: ${materiasNomes.join(", ")}`);
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
      // Combinar ano e letra no formato "Xº Ano Y"
      const nome = `${formData.ano}º Ano ${formData.letra}`;

      // Extrair arrays de matérias e professores únicos dos pares
      // Apenas matérias com professor selecionado serão incluídas
      const materiasProfessoresValidos = formData.materiasProfessores.filter(
        (mp) => mp.materiaId && mp.professorId
      );
      
      const materiasIds = materiasProfessoresValidos.map((mp) => mp.materiaId);
      const professoresIds = [...new Set(materiasProfessoresValidos.map((mp) => mp.professorId))];

      const turmaData = {
        nome: nome,
        periodo: formData.periodo,
        nivelEducacional: formData.nivelEducacional,
        alunos: formData.alunosIds,
        professores: professoresIds,
        materias: materiasIds,
      };

      const result = await turmaService.update(id, turmaData);

      if (!result.success) {
        const errorMessage = result.error || "Erro ao atualizar turma";
        showErrorToast(`❌ ${errorMessage}`);
        setLoading(false);
        return;
      }

      showSuccessToast("✅ Turma atualizada com sucesso!");
      navigate("/turmas");
    } catch (error) {
      showErrorToast(error.message || "Erro ao atualizar turma");
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingData) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <PageHeader title="Editar Turma" />

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Ano e Letra */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ano <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.ano}
              onChange={(e) => setFormData({ ...formData, ano: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            >
              <option value="">Selecione o ano</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Letra <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.letra}
              onChange={(e) => setFormData({ ...formData, letra: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            >
              <option value="">Selecione a letra</option>
              {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letra) => (
                <option key={letra} value={letra}>
                  {letra}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Período e Nível Educacional */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.periodo}
              onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            >
              <option value="">Selecione o período</option>
              <option value="manha">Manhã</option>
              <option value="tarde">Tarde</option>
              <option value="noite">Noite</option>
              <option value="integral">Integral</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nível Educacional <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.nivelEducacional}
              onChange={(e) => setFormData({ ...formData, nivelEducacional: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            >
              <option value="">Selecione o nível</option>
              <option value="maternal">Maternal</option>
              <option value="fundamental">Fundamental</option>
              <option value="ensinoMedio">Ensino Médio</option>
            </select>
          </div>
        </div>

        {/* Alunos */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alunos
          </label>
          
          {/* Alunos selecionados */}
          {alunosSelecionados.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {alunosSelecionados.map((aluno) => (
                <div
                  key={aluno._id}
                  className="inline-flex items-center gap-1 sm:gap-2 bg-orange-100 text-orange-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm"
                >
                  <span className="truncate max-w-[120px] sm:max-w-none">{aluno.userId?.name || "Sem nome"}</span>
                  <button
                    type="button"
                    onClick={() => removerAluno(aluno._id)}
                    className="hover:text-red-600 transition-colors shrink-0"
                  >
                    <FiX size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Campo de busca */}
          <div className="relative aluno-dropdown">
            <input
              type="text"
              value={searchAluno}
              onChange={(e) => {
                setSearchAluno(e.target.value);
                setShowAlunoDropdown(true);
              }}
              onFocus={() => setShowAlunoDropdown(true)}
              placeholder="Buscar aluno..."
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
            />
            {showAlunoDropdown && alunosFiltrados.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {alunosFiltrados.map((aluno) => (
                  <div
                    key={aluno._id}
                    onClick={() => selecionarAluno(aluno)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {aluno.userId?.name || "Sem nome"}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Matérias e Professores */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Matérias
          </label>

          {/* Lista de pares matéria-professor */}
          {materiasProfessoresCompletos.length > 0 && (
            <div className="space-y-3 mb-4">
              {materiasProfessoresCompletos.map((mp, index) => (
                <div
                  key={`${mp.materiaId}-${index}`}
                  className="bg-gray-100 border border-gray-200 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 relative"
                >
                  {/* Botão X - Posicionado no topo à direita em mobile/tablet, normal em desktop */}
                  <button
                    type="button"
                    onClick={() => removerMateriaProfessor(mp.materiaId)}
                    className="absolute top-2 right-2 sm:relative sm:top-auto sm:right-auto text-gray-500 hover:text-red-600 transition-colors shrink-0 sm:mt-0"
                    title="Remover matéria e professor"
                  >
                    <FiX size={20} />
                  </button>
                  <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full pr-8 sm:pr-0">
                    <div className="flex-1">
                      <span className="text-xs sm:text-sm text-orange-500 font-medium block mb-1">Materia</span>
                      <div className="bg-gray-50 border border-orange-500 rounded px-3 py-2 text-sm">
                        {mp.materiaNome}
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="text-xs sm:text-sm text-orange-500 font-medium block mb-1">Professor</span>
                      <select
                        value={mp.professorId || ""}
                        onChange={(e) => atualizarProfessor(mp.materiaId, e.target.value || null)}
                        className="w-full bg-gray-50 border border-orange-500 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">Selecione um professor</option>
                        {mp.professoresDisponiveis.map((professor) => (
                          <option key={professor._id} value={professor._id}>
                            {professor.userId?.name || "Sem nome"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Adicionar nova matéria */}
          <div className="relative materia-dropdown">
            <input
              type="text"
              value={searchMateria}
              onChange={(e) => {
                setSearchMateria(e.target.value);
                setShowMateriaDropdown(true);
              }}
              onFocus={() => setShowMateriaDropdown(true)}
              placeholder="Buscar matéria para adicionar..."
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
            />
            {showMateriaDropdown && materiasFiltradas.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {materiasFiltradas.map((materia) => (
                  <div
                    key={materia._id}
                    onClick={() => selecionarMateria(materia)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {materia.nome}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botões */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/turmas")}
            className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !hasChanges}
            className="w-full sm:w-auto px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Salvando..." : "Atualizar"}
          </button>
        </div>
      </form>
    </div>
  );
}
