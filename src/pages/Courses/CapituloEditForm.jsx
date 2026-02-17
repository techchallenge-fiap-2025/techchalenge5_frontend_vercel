import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import {
  showSuccessToast,
  showErrorToast,
} from "../../components/feedback/toastConfig";
import cursoService from "../../services/curso.service";
import {
  FiPlus,
  FiTrash2,
  FiVideo,
  FiFileText,
  FiUpload,
} from "react-icons/fi";

export function CapituloEditForm() {
  const { cursoId, capituloIndex } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [curso, setCurso] = useState(null);
  const [capitulo, setCapitulo] = useState(null);
  const [aulasOriginais, setAulasOriginais] = useState([]); // Aulas originais para comparar
  const [formData, setFormData] = useState({
    titulo: "",
    ordem: 1,
    aulas: [],
  });
  const [videoFiles, setVideoFiles] = useState({}); // { "capituloIndex-aulaIndex": File }
  const [videoPreviews, setVideoPreviews] = useState({}); // { "capituloIndex-aulaIndex": URL }

  // Buscar dados do curso e capítulo
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const result = await cursoService.getById(cursoId);
        if (result.success && result.data) {
          setCurso(result.data);
          const capIndex = parseInt(capituloIndex);

          if (
            result.data.capitulos &&
            capIndex >= 0 &&
            capIndex < result.data.capitulos.length
          ) {
            const cap = result.data.capitulos[capIndex];
            setCapitulo(cap);
            const aulasIniciais = cap.aulas || [];
            setAulasOriginais(aulasIniciais); // Guardar aulas originais para comparação
            setFormData({
              titulo: cap.titulo || "",
              ordem: cap.ordem || capIndex + 1,
              aulas: aulasIniciais.map((aula, aulaIdx) => ({
                ...aula,
                videoFile: null, // Não carregar arquivo, apenas URL se for vídeo
              })),
            });

            // Configurar previews de vídeos existentes
            const previews = {};
            cap.aulas?.forEach((aula, aulaIdx) => {
              if (aula.tipo === "video" && aula.conteudo) {
                previews[`0-${aulaIdx}`] = aula.conteudo;
              }
            });
            setVideoPreviews(previews);
          } else {
            showErrorToast("Capítulo não encontrado");
            navigate(`/curso/${cursoId}`);
          }
        } else {
          showErrorToast(result.error || "Erro ao carregar dados");
          navigate(`/curso/${cursoId}`);
        }
      } catch (error) {
        showErrorToast("Erro ao carregar dados do curso");
        navigate(`/curso/${cursoId}`);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (cursoId && capituloIndex !== undefined) {
      fetchData();
    }
  }, [cursoId, capituloIndex, navigate]);

  // Adicionar aula ao capítulo
  const adicionarAula = () => {
    const novaOrdem = formData.aulas.length + 1;
    setFormData({
      ...formData,
      aulas: [
        ...formData.aulas,
        {
          tipo: "texto",
          titulo: "",
          conteudo: "",
          duracaoMinutos: 1,
          ordem: novaOrdem,
        },
      ],
    });
  };

  // Remover aula do capítulo
  const removerAula = (aulaIndex) => {
    const novasAulas = formData.aulas.filter((_, index) => index !== aulaIndex);
    // Reordenar aulas
    const aulasReordenadas = novasAulas.map((aula, index) => ({
      ...aula,
      ordem: index + 1,
    }));

    // Remover vídeo associado se houver
    const newVideoFiles = { ...videoFiles };
    const newVideoPreviews = { ...videoPreviews };
    delete newVideoFiles[`0-${aulaIndex}`];
    delete newVideoPreviews[`0-${aulaIndex}`];

    // Reindexar vídeos restantes
    const reindexedVideoFiles = {};
    const reindexedVideoPreviews = {};
    Object.keys(newVideoFiles).forEach((key) => {
      const [capIdx, oldAulaIdx] = key.split("-").map(Number);
      if (oldAulaIdx > aulaIndex) {
        reindexedVideoFiles[`${capIdx}-${oldAulaIdx - 1}`] = newVideoFiles[key];
      } else if (oldAulaIdx < aulaIndex) {
        reindexedVideoFiles[key] = newVideoFiles[key];
      }
    });
    Object.keys(newVideoPreviews).forEach((key) => {
      const [capIdx, oldAulaIdx] = key.split("-").map(Number);
      if (oldAulaIdx > aulaIndex) {
        reindexedVideoPreviews[`${capIdx}-${oldAulaIdx - 1}`] =
          newVideoPreviews[key];
      } else if (oldAulaIdx < aulaIndex) {
        reindexedVideoPreviews[key] = newVideoPreviews[key];
      }
    });

    setVideoFiles(reindexedVideoFiles);
    setVideoPreviews(reindexedVideoPreviews);

    setFormData({
      ...formData,
      aulas: aulasReordenadas,
    });
  };

  // Atualizar campo do capítulo
  const atualizarCampoCapitulo = (campo, valor) => {
    setFormData({
      ...formData,
      [campo]: valor,
    });
  };

  // Atualizar campo da aula
  const atualizarCampoAula = (aulaIndex, campo, valor) => {
    const novasAulas = [...formData.aulas];
    const aula = { ...novasAulas[aulaIndex] };

    // Se mudou o tipo, ajustar
    if (campo === "tipo") {
      aula.tipo = valor;
      if (valor === "texto") {
        aula.duracaoMinutos = 1;
        aula.conteudo = "";
        // Remover vídeo se houver
        const newVideoFiles = { ...videoFiles };
        const newVideoPreviews = { ...videoPreviews };
        delete newVideoFiles[`0-${aulaIndex}`];
        delete newVideoPreviews[`0-${aulaIndex}`];
        setVideoFiles(newVideoFiles);
        setVideoPreviews(newVideoPreviews);
      } else if (valor === "video") {
        aula.duracaoMinutos = aula.duracaoMinutos || 1;
      }
    } else {
      aula[campo] = valor;
      // Se mudou o conteúdo de texto, garantir que duração seja 1 minuto
      if (campo === "conteudo" && aula.tipo === "texto") {
        aula.duracaoMinutos = 1;
      }
    }

    novasAulas[aulaIndex] = aula;
    setFormData({
      ...formData,
      aulas: novasAulas,
    });
  };

  // Manipular upload de vídeo
  const handleVideoChange = (aulaIndex, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        showErrorToast("O vídeo deve ter no máximo 100MB");
        return;
      }
      const key = `0-${aulaIndex}`;
      setVideoFiles({
        ...videoFiles,
        [key]: file,
      });
      setVideoPreviews({
        ...videoPreviews,
        [key]: URL.createObjectURL(file),
      });
    }
  };

  // Remover vídeo
  const removerVideo = (aulaIndex) => {
    const key = `0-${aulaIndex}`;
    const newVideoFiles = { ...videoFiles };
    const newVideoPreviews = { ...videoPreviews };
    delete newVideoFiles[key];
    delete newVideoPreviews[key];
    setVideoFiles(newVideoFiles);
    setVideoPreviews(newVideoPreviews);

    // Limpar conteúdo da aula se for vídeo
    atualizarCampoAula(aulaIndex, "conteudo", "");
  };

  const validarFormulario = () => {
    if (!formData.titulo.trim()) {
      showErrorToast("❌ Título do capítulo é obrigatório");
      return false;
    }

    if (formData.aulas.length === 0) {
      showErrorToast("❌ O capítulo deve ter pelo menos uma aula");
      return false;
    }

    for (let i = 0; i < formData.aulas.length; i++) {
      const aula = formData.aulas[i];
      if (!aula.titulo.trim()) {
        showErrorToast(`❌ Título da aula ${i + 1} é obrigatório`);
        return false;
      }

      if (aula.tipo === "texto" && !aula.conteudo.trim()) {
        showErrorToast(`❌ Conteúdo da aula ${i + 1} é obrigatório`);
        return false;
      }

      if (aula.tipo === "video" && !videoFiles[`0-${i}`] && !aula.conteudo) {
        showErrorToast(`❌ Vídeo da aula ${i + 1} é obrigatório`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    setLoading(true);

    try {
      const capIndex = parseInt(capituloIndex);

      // Criar cópia dos capítulos
      const capitulosAtualizados = [...curso.capitulos];

      // Preparar aulas para envio
      const aulasProcessadas = formData.aulas.map((aula, aulaIdx) => ({
        tipo: aula.tipo,
        titulo: aula.titulo.trim(),
        conteudo:
          aula.tipo === "video" && videoFiles[`0-${aulaIdx}`]
            ? "" // Será preenchido pelo backend após upload
            : aula.conteudo.trim(),
        duracaoMinutos: aula.duracaoMinutos || (aula.tipo === "texto" ? 1 : 1),
        ordem: aula.ordem || aulaIdx + 1,
      }));

      // Identificar aulas removidas comparando arrays
      // Uma aula foi removida se não existe mais nas novas aulas
      // Comparar por título e conteúdo para identificar remoções
      const aulasRemovidas = aulasOriginais.filter((aulaOriginal) => {
        // Verificar se esta aula original ainda existe nas novas aulas
        const aulaAindaExiste = formData.aulas.some((novaAula) => {
          // Comparar por título, tipo e conteúdo (para vídeos, comparar URL)
          return (
            aulaOriginal.titulo === novaAula.titulo &&
            aulaOriginal.tipo === novaAula.tipo &&
            aulaOriginal.conteudo === novaAula.conteudo
          );
        });
        return !aulaAindaExiste;
      });

      // Atualizar o capítulo específico
      capitulosAtualizados[capIndex] = {
        ...capitulosAtualizados[capIndex],
        titulo: formData.titulo.trim(),
        ordem: formData.ordem,
        aulas: aulasProcessadas,
        // Enviar informações sobre aulas removidas para o backend
        aulasRemovidas: aulasRemovidas.map((aula) => ({
          titulo: aula.titulo,
          tipo: aula.tipo,
          conteudo: aula.conteudo,
        })),
      };

      // Se há vídeos novos, fazer upload
      const hasNewVideos = Object.keys(videoFiles).length > 0;
      if (hasNewVideos) {
        // Criar FormData para enviar os vídeos
        const formDataToSend = new FormData();
        formDataToSend.append(
          "capitulos",
          JSON.stringify(capitulosAtualizados),
        );

        // Adicionar vídeos ao FormData
        Object.keys(videoFiles).forEach((key) => {
          const [capIdx, aulaIdx] = key.split("-").map(Number);
          if (capIdx === 0) {
            // Apenas vídeos deste capítulo
            formDataToSend.append(
              `video_${capIndex}_${aulaIdx}`,
              videoFiles[key],
            );
          }
        });

        const token = localStorage.getItem("token");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/curso/${cursoId}`,
          {
            method: "PUT",
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: formDataToSend,
          },
        );

        const data = await response.json();

        if (!response.ok) {
          showErrorToast(data.error || "Erro ao atualizar capítulo");
          setLoading(false);
          return;
        }
      } else {
        // Atualizar sem vídeos novos
        const result = await cursoService.update(cursoId, {
          capitulos: capitulosAtualizados,
        });

        if (!result.success) {
          showErrorToast(result.error || "Erro ao atualizar capítulo");
          setLoading(false);
          return;
        }
      }

      showSuccessToast("✅ Capítulo atualizado com sucesso!");
      navigate(`/curso/${cursoId}`);
    } catch (error) {
      showErrorToast(error.message || "Erro ao atualizar capítulo");
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingData) {
    return <LoadingScreen />;
  }

  if (!curso || !capitulo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <PageHeader title="Editar Capítulo" />

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 space-y-6"
      >
        {/* Título do Capítulo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título do Capítulo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.titulo}
            onChange={(e) => atualizarCampoCapitulo("titulo", e.target.value)}
            placeholder="Digite o título do capítulo"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
        </div>

        {/* Ordem */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ordem
          </label>
          <input
            type="number"
            value={formData.ordem}
            onChange={(e) =>
              atualizarCampoCapitulo("ordem", parseInt(e.target.value) || 1)
            }
            min="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
        </div>

        {/* Aulas do Capítulo */}
        <div className="space-y-4 pl-4 border-l-2 border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-700">Aulas</h4>
            <button
              type="button"
              onClick={adicionarAula}
              className="flex items-center gap-2 bg-gray-500 text-white hover:bg-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            >
              <FiPlus size={14} />
              Adicionar Aula
            </button>
          </div>

          {formData.aulas.map((aula, aulaIndex) => (
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
                        atualizarCampoAula(aulaIndex, "tipo", e.target.value)
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
                        atualizarCampoAula(aulaIndex, "titulo", e.target.value)
                      }
                      placeholder="Digite o título da aula"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Conteúdo */}
                  {aula.tipo === "texto" ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Conteúdo <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={aula.conteudo}
                        onChange={(e) =>
                          atualizarCampoAula(
                            aulaIndex,
                            "conteudo",
                            e.target.value,
                          )
                        }
                        placeholder="Digite o conteúdo da aula"
                        rows={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none break-words overflow-hidden"
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vídeo <span className="text-red-500">*</span>
                      </label>

                      {/* Preview do vídeo atual ou novo */}
                      {videoPreviews[`0-${aulaIndex}`] && (
                        <div className="mb-4 bg-gray-900 rounded-lg overflow-hidden aspect-video w-full">
                          <video
                            src={videoPreviews[`0-${aulaIndex}`]}
                            controls
                            className="w-full h-full object-cover"
                            style={{
                              objectFit: "fill",
                              width: "100%",
                              height: "100%",
                            }}
                          >
                            Seu navegador não suporta a tag de vídeo.
                          </video>
                          <button
                            type="button"
                            onClick={() => removerVideo(aulaIndex)}
                            className="mt-2 text-red-500 hover:text-red-700 text-sm"
                          >
                            Remover vídeo
                          </button>
                        </div>
                      )}

                      {/* Upload de novo vídeo */}
                      {!videoPreviews[`0-${aulaIndex}`] && (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleVideoChange(aulaIndex, e)}
                            className="hidden"
                            id={`video-upload-${aulaIndex}`}
                          />
                          <label
                            htmlFor={`video-upload-${aulaIndex}`}
                            className="cursor-pointer flex flex-col items-center gap-2"
                          >
                            <FiVideo size={24} className="text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {videoFiles[`0-${aulaIndex}`]
                                ? videoFiles[`0-${aulaIndex}`].name
                                : "Clique para fazer upload do vídeo"}
                            </span>
                            <span className="text-xs text-gray-500">
                              MP4, MOV, AVI, WMV, FLV, WEBM (máx. 100MB)
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {formData.aulas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removerAula(aulaIndex)}
                    className="text-red-500 hover:text-red-700 transition-colors p-2 shrink-0"
                    title="Remover aula"
                  >
                    <FiTrash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(`/curso/${cursoId}`)}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
