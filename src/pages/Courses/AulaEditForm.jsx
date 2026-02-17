import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import {
  showSuccessToast,
  showErrorToast,
} from "../../components/feedback/toastConfig";
import cursoService from "../../services/curso.service";
import { FiPlay, FiVideo, FiFileText } from "react-icons/fi";

export function AulaEditForm() {
  const { cursoId, capituloIndex, aulaIndex } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [curso, setCurso] = useState(null);
  const [capitulo, setCapitulo] = useState(null);
  const [aula, setAula] = useState(null);
  const [formData, setFormData] = useState({
    titulo: "",
    tipo: "texto",
    conteudo: "",
  });
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  // Buscar dados do curso e aula
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const result = await cursoService.getById(cursoId);
        if (result.success && result.data) {
          setCurso(result.data);
          const capIndex = parseInt(capituloIndex);
          const aulaIdx = parseInt(aulaIndex);

          if (
            result.data.capitulos &&
            capIndex >= 0 &&
            capIndex < result.data.capitulos.length
          ) {
            const cap = result.data.capitulos[capIndex];
            setCapitulo(cap);

            if (cap.aulas && aulaIdx >= 0 && aulaIdx < cap.aulas.length) {
              const aulaData = cap.aulas[aulaIdx];
              setAula(aulaData);
              setFormData({
                titulo: aulaData.titulo || "",
                tipo: aulaData.tipo || "texto",
                conteudo: aulaData.conteudo || "",
              });

              // Se for vídeo, definir preview
              if (aulaData.tipo === "video" && aulaData.conteudo) {
                setVideoPreview(aulaData.conteudo);
              }
            } else {
              showErrorToast("Aula não encontrada");
              navigate(`/curso/${cursoId}`);
            }
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

    if (cursoId && capituloIndex !== undefined && aulaIndex !== undefined) {
      fetchData();
    }
  }, [cursoId, capituloIndex, aulaIndex, navigate]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Se mudou o tipo para texto, limpar vídeo
    if (field === "tipo" && value === "texto") {
      setVideoFile(null);
      setVideoPreview(null);
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        showErrorToast("O vídeo deve ter no máximo 100MB");
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const validarFormulario = () => {
    if (!formData.titulo.trim()) {
      showErrorToast("❌ Título é obrigatório");
      return false;
    }

    if (formData.tipo === "texto" && !formData.conteudo.trim()) {
      showErrorToast("❌ Conteúdo é obrigatório");
      return false;
    }

    if (formData.tipo === "video" && !videoFile && !formData.conteudo) {
      showErrorToast("❌ Vídeo é obrigatório");
      return false;
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
      const aulaIdx = parseInt(aulaIndex);

      // Criar cópia dos capítulos
      const capitulosAtualizados = [...curso.capitulos];

      // Atualizar a aula específica
      const aulaAtualizada = {
        ...capitulosAtualizados[capIndex].aulas[aulaIdx],
        titulo: formData.titulo.trim(),
        tipo: formData.tipo,
        conteudo:
          formData.tipo === "video" && videoFile
            ? "" // Será preenchido pelo backend após upload
            : formData.conteudo.trim(),
        // Manter ordem e duracaoMinutos originais
      };

      capitulosAtualizados[capIndex].aulas[aulaIdx] = aulaAtualizada;

      // Se há novo vídeo, precisamos fazer upload
      if (formData.tipo === "video" && videoFile) {
        // Criar FormData para enviar o vídeo
        const formDataToSend = new FormData();
        formDataToSend.append(
          "capitulos",
          JSON.stringify(capitulosAtualizados),
        );
        formDataToSend.append(`video_${capIndex}_${aulaIdx}`, videoFile);

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
          showErrorToast(data.error || "Erro ao atualizar aula");
          setLoading(false);
          return;
        }
      } else {
        // Atualizar sem vídeo novo
        const result = await cursoService.update(cursoId, {
          capitulos: capitulosAtualizados,
        });

        if (!result.success) {
          showErrorToast(result.error || "Erro ao atualizar aula");
          setLoading(false);
          return;
        }
      }

      showSuccessToast("✅ Aula atualizada com sucesso!");
      navigate(`/curso/${cursoId}`);
    } catch (error) {
      showErrorToast(error.message || "Erro ao atualizar aula");
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingData) {
    return <LoadingScreen />;
  }

  if (!curso || !capitulo || !aula) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <PageHeader title="Editar Aula" />

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 space-y-6"
      >
        {/* Informação do Capítulo */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600">
            <span className="font-semibold">Capítulo:</span> {capitulo.titulo}
          </p>
        </div>

        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.titulo}
            onChange={(e) => handleChange("titulo", e.target.value)}
            placeholder="Digite o título da aula"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
        </div>

        {/* Tipo da Aula */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo da Aula <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.tipo}
            onChange={(e) => handleChange("tipo", e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          >
            <option value="texto">Texto</option>
            <option value="video">Vídeo</option>
          </select>
        </div>

        {/* Conteúdo */}
        {formData.tipo === "texto" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Conteúdo <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.conteudo}
              onChange={(e) => handleChange("conteudo", e.target.value)}
              placeholder="Digite o conteúdo da aula"
              rows={10}
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
            {videoPreview && (
              <div className="mb-4 bg-gray-900 rounded-lg overflow-hidden aspect-video w-full">
                <video
                  src={videoPreview}
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
              </div>
            )}

            {/* Upload de novo vídeo */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoChange}
                className="hidden"
                id="video-upload"
              />
              <label
                htmlFor="video-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <FiVideo size={24} className="text-gray-400" />
                <span className="text-sm text-gray-600">
                  {videoFile
                    ? videoFile.name
                    : "Clique para fazer upload do vídeo"}
                </span>
                <span className="text-xs text-gray-500">
                  MP4, MOV, AVI, WMV, FLV, WEBM (máx. 100MB)
                </span>
              </label>
            </div>

            {/* Se não há vídeo novo e não há preview, mostrar mensagem */}
            {!videoPreview && !videoFile && (
              <p className="text-sm text-gray-500 mt-2">
                Selecione um novo vídeo para substituir o atual
              </p>
            )}
          </div>
        )}

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
