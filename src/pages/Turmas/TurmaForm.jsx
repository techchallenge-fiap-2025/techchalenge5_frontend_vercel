import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiX } from "react-icons/fi";
import { PageHeader } from "../../components/ui/PageHeader";
import { showSuccessToast, showErrorToast, showWarningToast } from "../../components/feedback/toastConfig";
import turmaService from "../../services/turma.service";
import alunoService from "../../services/aluno.service";
import materiaService from "../../services/materia.service";

export function TurmaForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [alunos, setAlunos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [alunosEmTurmasDoAno, setAlunosEmTurmasDoAno] = useState([]);
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
    materiasIds: [],
  });

  // Buscar alunos, matérias e turmas do ano letivo atual ao carregar
  useEffect(() => {
    const fetchData = async () => {
      const anoLetivoAtual = new Date().getFullYear();
      
      const [alunosResult, materiasResult, turmasResult] = await Promise.all([
        alunoService.getAll(),
        materiaService.getAll(),
        turmaService.getAll(),
      ]);
      
      if (alunosResult.success) {
        setAlunos(alunosResult.data || []);
      }
      if (materiasResult.success) {
        setMaterias(materiasResult.data || []);
      }
      
      // Buscar IDs dos alunos que já estão em turmas do ano letivo atual
      if (turmasResult.success) {
        const turmasDoAno = (turmasResult.data || []).filter(
          (turma) => turma.anoLetivo === anoLetivoAtual
        );
        
        // Coletar todos os IDs de alunos que já estão em turmas do ano letivo
        const alunosEmTurmas = new Set();
        turmasDoAno.forEach((turma) => {
          if (turma.alunos && Array.isArray(turma.alunos)) {
            turma.alunos.forEach((aluno) => {
              // Se aluno é um objeto populado, usar _id, senão usar o próprio valor
              const alunoId = typeof aluno === 'object' && aluno !== null 
                ? (aluno._id?.toString() || aluno.toString())
                : aluno?.toString();
              if (alunoId) {
                alunosEmTurmas.add(alunoId);
              }
            });
          }
        });
        
        setAlunosEmTurmasDoAno(Array.from(alunosEmTurmas));
      }
    };
    fetchData();
  }, []);

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

  // Filtrar alunos (excluir os já selecionados e os que já estão em turmas do ano letivo)
  const alunosFiltrados = alunos.filter((aluno) => {
    const alunoIdStr = aluno._id?.toString();
    
    // Verificar se o aluno já está em alguma turma do ano letivo atual
    const jaEstaEmTurma = alunosEmTurmasDoAno.includes(alunoIdStr);
    
    const nomeMatch = (aluno.userId?.name || "").toLowerCase().includes(searchAluno.toLowerCase());
    const naoSelecionado = !formData.alunosIds.includes(aluno._id);
    
    return nomeMatch && naoSelecionado && !jaEstaEmTurma;
  });

  // Filtrar matérias (excluir as já selecionadas)
  const materiasFiltradas = materias.filter((materia) => {
    const nomeMatch = (materia.nome || "").toLowerCase().includes(searchMateria.toLowerCase());
    const naoSelecionada = !formData.materiasIds.includes(materia._id);
    return nomeMatch && naoSelecionada;
  });

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

  // Selecionar matéria
  const selecionarMateria = (materia) => {
    setFormData({
      ...formData,
      materiasIds: [...formData.materiasIds, materia._id],
    });
    setSearchMateria("");
    setShowMateriaDropdown(false);
  };

  // Remover matéria selecionada
  const removerMateria = (materiaId) => {
    setFormData({
      ...formData,
      materiasIds: formData.materiasIds.filter((id) => id !== materiaId),
    });
  };

  // Obter alunos selecionados
  const alunosSelecionados = alunos.filter((aluno) =>
    formData.alunosIds.includes(aluno._id)
  );

  // Obter matérias selecionadas
  const materiasSelecionadas = materias.filter((materia) =>
    formData.materiasIds.includes(materia._id)
  );

  // Validar formulário
  const validarFormulario = () => {
    if (!formData.ano || !formData.letra || !formData.periodo || !formData.nivelEducacional) {
      showErrorToast("❌ Todos os campos são obrigatórios");
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
      
      const turmaData = {
        nome: nome,
        periodo: formData.periodo,
        nivelEducacional: formData.nivelEducacional,
        anoLetivo: new Date().getFullYear(), // Ano atual automaticamente
        alunos: formData.alunosIds,
        professores: [], // Professores serão definidos posteriormente
        materias: formData.materiasIds,
      };

      const result = await turmaService.create(turmaData);

      if (!result.success) {
        const errorMessage = result.error || "Erro ao criar turma";
        const errorLower = errorMessage.toLowerCase();
        
        // Verificar se é erro de turma duplicada
        if (errorLower.includes("já existe")) {
          showWarningToast(`⚠️ ${errorMessage}`);
        } else {
          showErrorToast(`❌ ${errorMessage}`);
        }
        setLoading(false);
        return;
      }

      showSuccessToast("✅ Turma criada com sucesso!");
      navigate("/turmas");
    } catch (error) {
      showErrorToast(error.message || "Erro ao criar turma");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <PageHeader title="Cadastrar Turma" />

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

        {/* Matérias */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Matérias
          </label>
          
          {/* Matérias selecionadas */}
          {materiasSelecionadas.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {materiasSelecionadas.map((materia) => (
                <div
                  key={materia._id}
                  className="inline-flex items-center gap-1 sm:gap-2 bg-orange-100 text-orange-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm"
                >
                  <span className="truncate max-w-[120px] sm:max-w-none">{materia.nome}</span>
                  <button
                    type="button"
                    onClick={() => removerMateria(materia._id)}
                    className="hover:text-red-600 transition-colors shrink-0"
                  >
                    <FiX size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Campo de busca */}
          <div className="relative materia-dropdown">
            <input
              type="text"
              value={searchMateria}
              onChange={(e) => {
                setSearchMateria(e.target.value);
                setShowMateriaDropdown(true);
              }}
              onFocus={() => setShowMateriaDropdown(true)}
              placeholder="Buscar matéria..."
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
