import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
} from "../../components/feedback/toastConfig";
import cursoService from "../../services/curso.service";
import materiaService from "../../services/materia.service";
import turmaService from "../../services/turma.service";
import { useAuth } from "../../context/AuthContext";
import { FiPlus, FiTrash2, FiX, FiUpload } from "react-icons/fi";
import { LoadingScreen } from "../../components/ui/LoadingScreen";

export function CursoForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [materias, setMaterias] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [searchTurma, setSearchTurma] = useState("");
  const [showTurmaDropdown, setShowTurmaDropdown] = useState(false);
  const [searchMateria, setSearchMateria] = useState("");
  const [showMateriaDropdown, setShowMateriaDropdown] = useState(false);

  const [capaFile, setCapaFile] = useState(null);
  const [capaPreview, setCapaPreview] = useState(null);

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    materiaId: "", // ID da matéria selecionada (apenas uma)
    turmasPermitidas: [], // Array de IDs das turmas selecionadas
    capitulos: [
      {
        titulo: "",
        ordem: 1,
        aulas: [
          {
            tipo: "texto",
            titulo: "",
            conteudo: "",
            duracaoMinutos: 1,
            ordem: 1,
          },
        ],
      },
    ],
  });

  // Buscar matérias e turmas do professor
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar matérias do professor
        const materiasResult = await materiaService.getMinhasMaterias();
        if (materiasResult.success) {
          setMaterias(materiasResult.data || []);
        }

        // Buscar turmas do professor
        const turmasResult = await turmaService.getMinhasTurmas();
        if (turmasResult.success) {
          setTurmas(turmasResult.data || []);
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      }
    };

    if (user?.role === "professor") {
      fetchData();
    }
  }, [user]);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTurmaDropdown && !event.target.closest(".turma-dropdown")) {
        setShowTurmaDropdown(false);
      }
      if (showMateriaDropdown && !event.target.closest(".materia-dropdown")) {
        setShowMateriaDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTurmaDropdown, showMateriaDropdown]);

  // Filtrar turmas para o dropdown
  const turmasFiltradas = useMemo(() => {
    return turmas.filter((turma) => {
      const nomeCompleto = `${turma.nome} ${turma.anoLetivo || ""}`.trim();
      const nomeMatch = nomeCompleto
        .toLowerCase()
        .includes(searchTurma.toLowerCase());
      const naoSelecionado = !formData.turmasPermitidas.includes(turma._id);
      return nomeMatch && naoSelecionado;
    });
  }, [turmas, searchTurma, formData.turmasPermitidas]);

  // Selecionar turma
  const selecionarTurma = (turma) => {
    setFormData({
      ...formData,
      turmasPermitidas: [...formData.turmasPermitidas, turma._id],
    });
    setSearchTurma("");
    setShowTurmaDropdown(false);
  };

  // Remover turma selecionada
  const removerTurma = (turmaId) => {
    setFormData({
      ...formData,
      turmasPermitidas: formData.turmasPermitidas.filter(
        (id) => id !== turmaId,
      ),
    });
  };

  // Obter turmas selecionadas
  const turmasSelecionadas = turmas.filter((turma) =>
    formData.turmasPermitidas.includes(turma._id),
  );

  // Filtrar matérias para o dropdown
  const materiasFiltradas = useMemo(() => {
    return materias.filter((materia) => {
      const nomeMatch = materia.nome
        .toLowerCase()
        .includes(searchMateria.toLowerCase());
      const naoSelecionada = materia._id !== formData.materiaId;
      return nomeMatch && naoSelecionada;
    });
  }, [materias, searchMateria, formData.materiaId]);

  // Selecionar matéria
  const selecionarMateria = (materia) => {
    setFormData({
      ...formData,
      materiaId: materia._id,
    });
    setSearchMateria("");
    setShowMateriaDropdown(false);
  };

  // Remover matéria selecionada
  const removerMateria = () => {
    setFormData({
      ...formData,
      materiaId: "",
    });
  };

  // Obter matéria selecionada
  const materiaSelecionada = materias.find(
    (materia) => materia._id === formData.materiaId,
  );

  // Função para calcular duração do vídeo (em minutos)
  const calcularDuracaoVideo = (videoFile) => {
    return new Promise((resolve) => {
      if (!videoFile) {
        resolve(1);
        return;
      }

      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duracaoMinutos = Math.ceil(video.duration / 60);
        resolve(duracaoMinutos || 1);
      };

      video.onerror = () => {
        resolve(1); // Se não conseguir calcular, retorna 1 minuto
      };

      video.src = URL.createObjectURL(videoFile);
    });
  };

  // Adicionar capítulo
  const adicionarCapitulo = () => {
    const novoOrdem = formData.capitulos.length + 1;
    setFormData({
      ...formData,
      capitulos: [
        ...formData.capitulos,
        {
          titulo: "",
          ordem: novoOrdem,
          aulas: [
            {
              tipo: "texto",
              titulo: "",
              conteudo: "",
              duracaoMinutos: 1,
              ordem: 1,
            },
          ],
        },
      ],
    });
  };

  // Remover capítulo
  const removerCapitulo = (capituloIndex) => {
    const novosCapitulos = formData.capitulos.filter(
      (_, index) => index !== capituloIndex,
    );
    // Reordenar capítulos
    const capitulosReordenados = novosCapitulos.map((capitulo, index) => ({
      ...capitulo,
      ordem: index + 1,
    }));
    setFormData({
      ...formData,
      capitulos: capitulosReordenados,
    });
  };

  // Adicionar aula ao capítulo
  const adicionarAula = (capituloIndex) => {
    const capitulo = formData.capitulos[capituloIndex];
    const novaOrdem = capitulo.aulas.length + 1;
    const novasAulas = [
      ...capitulo.aulas,
      {
        tipo: "texto",
        titulo: "",
        conteudo: "",
        duracaoMinutos: 1,
        ordem: novaOrdem,
      },
    ];

    const novosCapitulos = [...formData.capitulos];
    novosCapitulos[capituloIndex] = {
      ...capitulo,
      aulas: novasAulas,
    };

    setFormData({
      ...formData,
      capitulos: novosCapitulos,
    });
  };

  // Remover aula do capítulo
  const removerAula = (capituloIndex, aulaIndex) => {
    const capitulo = formData.capitulos[capituloIndex];
    const novasAulas = capitulo.aulas.filter((_, index) => index !== aulaIndex);
    // Reordenar aulas
    const aulasReordenadas = novasAulas.map((aula, index) => ({
      ...aula,
      ordem: index + 1,
    }));

    const novosCapitulos = [...formData.capitulos];
    novosCapitulos[capituloIndex] = {
      ...capitulo,
      aulas: aulasReordenadas,
    };

    setFormData({
      ...formData,
      capitulos: novosCapitulos,
    });
  };

  // Atualizar campo do curso
  const atualizarCampoCurso = (campo, valor) => {
    setFormData({
      ...formData,
      [campo]: valor,
    });
  };

  // Atualizar campo do capítulo
  const atualizarCampoCapitulo = (capituloIndex, campo, valor) => {
    const novosCapitulos = [...formData.capitulos];
    novosCapitulos[capituloIndex] = {
      ...novosCapitulos[capituloIndex],
      [campo]: valor,
    };
    setFormData({
      ...formData,
      capitulos: novosCapitulos,
    });
  };

  // Atualizar campo da aula
  const atualizarCampoAula = async (capituloIndex, aulaIndex, campo, valor) => {
    const novosCapitulos = [...formData.capitulos];
    const capitulo = novosCapitulos[capituloIndex];
    const novasAulas = [...capitulo.aulas];
    const aula = { ...novasAulas[aulaIndex] };

    // Se mudou o tipo, ajustar duração
    if (campo === "tipo") {
      aula.tipo = valor;
      if (valor === "texto") {
        aula.duracaoMinutos = 1;
        aula.conteudo = ""; // Limpar conteúdo de vídeo se mudou para texto
      } else if (valor === "video") {
        // Se já tem arquivo de vídeo, calcular duração
        if (aula.videoFile) {
          const duracao = await calcularDuracaoVideo(aula.videoFile);
          aula.duracaoMinutos = duracao;
        } else {
          aula.duracaoMinutos = 1;
        }
      }
    } else if (campo === "videoFile") {
      // Quando um vídeo é selecionado, calcular duração
      aula.videoFile = valor;
      if (valor) {
        const duracao = await calcularDuracaoVideo(valor);
        aula.duracaoMinutos = duracao;
        // Criar URL temporária para o vídeo
        aula.conteudo = URL.createObjectURL(valor);
      }
    } else {
      aula[campo] = valor;
      // Se mudou o conteúdo de texto, garantir que duração seja 1 minuto
      if (campo === "conteudo" && aula.tipo === "texto") {
        aula.duracaoMinutos = 1;
      }
    }

    novasAulas[aulaIndex] = aula;
    capitulo.aulas = novasAulas;
    novosCapitulos[capituloIndex] = capitulo;

    setFormData({
      ...formData,
      capitulos: novosCapitulos,
    });
  };

  // Validar formulário
  const validarFormulario = () => {
    // Verificar se todos os campos principais estão vazios
    const tituloVazio = !formData.titulo.trim();
    const materiaVazia = !formData.materiaId;
    const turmasVazias = formData.turmasPermitidas.length === 0;
    const capituloVazio =
      !formData.capitulos[0] || !formData.capitulos[0].titulo.trim();
    const aulaVazia =
      !formData.capitulos[0] ||
      !formData.capitulos[0].aulas[0] ||
      !formData.capitulos[0].aulas[0].titulo.trim();

    const todosCamposVazios =
      tituloVazio && materiaVazia && turmasVazias && capituloVazio && aulaVazia;

    if (todosCamposVazios) {
      showErrorToast("❌ Todos os campos são obrigatórios");
      return false;
    }

    if (!formData.titulo.trim()) {
      showErrorToast("❌ Título do curso é obrigatório");
      return false;
    }

    // Validar descrição com pelo menos 150 caracteres
    if (formData.descricao.trim() && formData.descricao.trim().length < 150) {
      showWarningToast("⚠️ Descrição deve ter pelo menos 150 caracteres");
      return false;
    }

    if (!formData.materiaId) {
      showErrorToast("❌ Selecione uma matéria");
      return false;
    }

    if (formData.turmasPermitidas.length === 0) {
      showErrorToast("❌ Selecione pelo menos uma turma");
      return false;
    }

    // Validar capítulos
    for (let i = 0; i < formData.capitulos.length; i++) {
      const capitulo = formData.capitulos[i];
      if (!capitulo.titulo.trim()) {
        showErrorToast(`❌ Título do capítulo ${i + 1} é obrigatório`);
        return false;
      }

      // Validar aulas
      for (let j = 0; j < capitulo.aulas.length; j++) {
        const aula = capitulo.aulas[j];
        if (!aula.titulo.trim()) {
          showErrorToast(
            `❌ Título da aula ${j + 1} do capítulo ${i + 1} é obrigatório`,
          );
          return false;
        }

        if (aula.tipo === "texto" && !aula.conteudo.trim()) {
          showErrorToast(
            `❌ Conteúdo da aula ${j + 1} do capítulo ${i + 1} é obrigatório`,
          );
          return false;
        }

        if (aula.tipo === "video" && !aula.videoFile && !aula.conteudo) {
          showErrorToast(
            `❌ Vídeo da aula ${j + 1} do capítulo ${i + 1} é obrigatório`,
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
      // Criar FormData para enviar arquivos
      const formDataToSend = new FormData();

      // Adicionar dados do curso
      formDataToSend.append("titulo", formData.titulo.trim());
      formDataToSend.append("descricao", formData.descricao.trim());
      formDataToSend.append("materiaId", formData.materiaId);
      // Enviar turmasPermitidas como JSON string para facilitar parsing no backend
      formDataToSend.append(
        "turmasPermitidas",
        JSON.stringify(formData.turmasPermitidas),
      );

      // Adicionar capa se houver
      if (capaFile) {
        formDataToSend.append("capa", capaFile);
      }

      // Preparar capítulos e adicionar vídeos
      const capitulosParaEnvio = [];
      formData.capitulos.forEach((capitulo, capituloIndex) => {
        const aulasParaEnvio = capitulo.aulas.map((aula, aulaIndex) => {
          // Se for vídeo e tiver arquivo, adicionar ao FormData
          if (aula.tipo === "video" && aula.videoFile) {
            formDataToSend.append(
              `video_${capituloIndex}_${aulaIndex}`,
              aula.videoFile,
            );
          }

          return {
            tipo: aula.tipo,
            titulo: aula.titulo,
            conteudo:
              aula.tipo === "video" && aula.videoFile ? "" : aula.conteudo, // Será preenchido pelo backend
            duracaoMinutos: aula.duracaoMinutos,
            ordem: aula.ordem,
          };
        });

        capitulosParaEnvio.push({
          titulo: capitulo.titulo,
          ordem: capitulo.ordem,
          aulas: aulasParaEnvio,
        });
      });

      formDataToSend.append("capitulos", JSON.stringify(capitulosParaEnvio));

      const result = await cursoService.create(formDataToSend);

      if (!result.success) {
        showErrorToast(`❌ ${result.error || "Erro ao criar curso"}`);
        setLoading(false);
        return;
      }

      // Manter loading ativo durante o redirecionamento
      showSuccessToast("✅ Curso criado com sucesso!");
      // Pequeno delay para garantir que o toast seja exibido antes do redirecionamento
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (error) {
      showErrorToast(error.message || "Erro ao criar curso");
      setLoading(false);
    }
  };

  // Mostrar tela de carregamento enquanto está criando o curso
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <PageHeader title="Criar Curso" />

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 space-y-6"
      >
        {/* Título do Curso */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título do Curso <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.titulo}
            onChange={(e) => atualizarCampoCurso("titulo", e.target.value)}
            placeholder="Digite o título do curso"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descrição <span className="text-red-500">*</span>
            <span className="text-xs text-gray-500 ml-2">
              (Mínimo 150 caracteres)
            </span>
          </label>
          <textarea
            value={formData.descricao}
            onChange={(e) => atualizarCampoCurso("descricao", e.target.value)}
            placeholder="Digite a descrição do curso (mínimo 150 caracteres)"
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.descricao.length}/150 caracteres
          </p>
        </div>

        {/* Capa do Curso */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Capa do Curso
          </label>
          {capaPreview && (
            <div className="mb-3 relative inline-block">
              <img
                src={capaPreview}
                alt="Preview da capa"
                className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
              />
              <button
                type="button"
                onClick={() => {
                  setCapaFile(null);
                  setCapaPreview(null);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                title="Remover capa"
              >
                <FiX size={16} />
              </button>
            </div>
          )}
          {!capaPreview && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      showErrorToast("A imagem deve ter no máximo 5MB");
                      return;
                    }
                    setCapaFile(file);
                    setCapaPreview(URL.createObjectURL(file));
                  }
                }}
                className="hidden"
                id="capa-upload"
              />
              <label
                htmlFor="capa-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <FiUpload size={24} className="text-gray-400" />
                <span className="text-sm text-gray-600">
                  Clique para fazer upload da capa
                </span>
                <span className="text-xs text-gray-500">
                  JPEG, PNG, WEBP, GIF (máx. 5MB)
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Matéria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Matéria <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {/* Chip da matéria selecionada */}
            {materiaSelecionada && (
              <div className="flex flex-wrap gap-2 mb-2">
                <div className="inline-flex items-center gap-1 sm:gap-2 bg-orange-100 text-orange-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                  <span className="truncate max-w-[120px] sm:max-w-none">
                    {materiaSelecionada.nome}
                  </span>
                  <button
                    type="button"
                    onClick={removerMateria}
                    className="hover:text-red-600 transition-colors shrink-0"
                  >
                    <FiX size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Campo de busca */}
            {!materiaSelecionada && (
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
            )}
          </div>
        </div>

        {/* Turmas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Turmas <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {/* Chips das turmas selecionadas */}
            {turmasSelecionadas.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {turmasSelecionadas.map((turma) => (
                  <div
                    key={turma._id}
                    className="inline-flex items-center gap-1 sm:gap-2 bg-orange-100 text-orange-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm"
                  >
                    <span className="truncate max-w-[120px] sm:max-w-none">
                      {turma.nome} {turma.anoLetivo || ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => removerTurma(turma._id)}
                      className="hover:text-red-600 transition-colors shrink-0"
                    >
                      <FiX size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Campo de busca */}
            <div className="relative turma-dropdown">
              <input
                type="text"
                value={searchTurma}
                onChange={(e) => {
                  setSearchTurma(e.target.value);
                  setShowTurmaDropdown(true);
                }}
                onFocus={() => setShowTurmaDropdown(true)}
                placeholder="Buscar turma..."
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              />
              {showTurmaDropdown && turmasFiltradas.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {turmasFiltradas.map((turma) => (
                    <div
                      key={turma._id}
                      onClick={() => selecionarTurma(turma)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {turma.nome} {turma.anoLetivo || ""}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Capítulos */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700">Capítulos</h3>
            <button
              type="button"
              onClick={adicionarCapitulo}
              className="flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <FiPlus size={16} />
              Adicionar Capítulo
            </button>
          </div>

          {formData.capitulos.map((capitulo, capituloIndex) => (
            <div
              key={capituloIndex}
              className="border border-gray-300 rounded-lg p-4 space-y-4"
            >
              {/* Cabeçalho do Capítulo */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título do Capítulo {capituloIndex + 1}{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={capitulo.titulo}
                      onChange={(e) =>
                        atualizarCampoCapitulo(
                          capituloIndex,
                          "titulo",
                          e.target.value,
                        )
                      }
                      placeholder="Digite o título do capítulo"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ordem
                    </label>
                    <input
                      type="number"
                      value={capitulo.ordem}
                      onChange={(e) =>
                        atualizarCampoCapitulo(
                          capituloIndex,
                          "ordem",
                          parseInt(e.target.value) || 1,
                        )
                      }
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {formData.capitulos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerCapitulo(capituloIndex)}
                    className="text-red-500 hover:text-red-700 transition-colors p-2"
                    title="Remover capítulo"
                  >
                    <FiTrash2 size={20} />
                  </button>
                )}
              </div>

              {/* Aulas do Capítulo */}
              <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-gray-700">Aulas</h4>
                  <button
                    type="button"
                    onClick={() => adicionarAula(capituloIndex)}
                    className="flex items-center gap-2 bg-gray-500 text-white hover:bg-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FiPlus size={14} />
                    Adicionar Aula
                  </button>
                </div>

                {capitulo.aulas.map((aula, aulaIndex) => (
                  <div
                    key={aulaIndex}
                    className="bg-gray-50 rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-4">
                        {/* Tipo */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={aula.tipo}
                            onChange={(e) =>
                              atualizarCampoAula(
                                capituloIndex,
                                aulaIndex,
                                "tipo",
                                e.target.value,
                              )
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            required
                          >
                            <option value="texto">Texto</option>
                            <option value="video">Vídeo</option>
                          </select>
                        </div>

                        {/* Título */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Título <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={aula.titulo}
                            onChange={(e) =>
                              atualizarCampoAula(
                                capituloIndex,
                                aulaIndex,
                                "titulo",
                                e.target.value,
                              )
                            }
                            placeholder="Digite o título da aula"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            required
                          />
                        </div>

                        {/* Conteúdo ou Vídeo */}
                        {aula.tipo === "texto" ? (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Conteúdo <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={aula.conteudo}
                              onChange={(e) =>
                                atualizarCampoAula(
                                  capituloIndex,
                                  aulaIndex,
                                  "conteudo",
                                  e.target.value,
                                )
                              }
                              placeholder="Digite o conteúdo da aula"
                              rows={6}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                              required
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Vídeo <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="file"
                              accept="video/*"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  atualizarCampoAula(
                                    capituloIndex,
                                    aulaIndex,
                                    "videoFile",
                                    file,
                                  );
                                }
                              }}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              required={!aula.conteudo}
                            />
                            {aula.conteudo && (
                              <p className="text-sm text-gray-600 mt-2">
                                Vídeo selecionado:{" "}
                                {aula.videoFile?.name || "Vídeo carregado"}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Ordem */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ordem
                          </label>
                          <input
                            type="number"
                            value={aula.ordem}
                            onChange={(e) =>
                              atualizarCampoAula(
                                capituloIndex,
                                aulaIndex,
                                "ordem",
                                parseInt(e.target.value) || 1,
                              )
                            }
                            min="1"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            required
                          />
                        </div>

                        {/* Duração em Minutos */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duração (minutos)
                          </label>
                          <input
                            type="number"
                            value={aula.duracaoMinutos}
                            readOnly
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {aula.tipo === "texto"
                              ? "Duração automática: 1 minuto para aulas de texto"
                              : "Duração calculada automaticamente do vídeo"}
                          </p>
                        </div>
                      </div>

                      {capitulo.aulas.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removerAula(capituloIndex, aulaIndex)}
                          className="text-red-500 hover:text-red-700 transition-colors p-2"
                          title="Remover aula"
                        >
                          <FiX size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Botões */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Criando..." : "Criar Curso"}
          </button>
        </div>
      </form>
    </div>
  );
}
