import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";

export function CertificateModal({ isOpen, onClose, cursoId, cursoTitulo }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fechar modal ao pressionar ESC e carregar PDF
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const loadCertificate = async () => {
      if (!cursoId || !isOpen) return;

      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        const apiUrl =
          import.meta.env.VITE_API_URL || "http://localhost:3000/api";

        const response = await fetch(
          `${apiUrl}/progresso-curso/certificado/${cursoId}`,
          {
            method: "GET",
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          },
        );

        if (!response.ok) {
          throw new Error("Erro ao carregar certificado");
        }

        // Criar blob e URL para exibição
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (error) {
        console.error("Erro ao carregar certificado:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevenir scroll do body quando modal está aberto
      document.body.style.overflow = "hidden";

      // Carregar PDF quando modal abrir
      loadCertificate();
    } else {
      // Limpar URL quando modal fechar
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
      }
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, cursoId, onClose]);

  // Limpar URL quando componente desmontar
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white-50 backdrop-blur-xl"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header do Modal */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">
            Certificado - {cursoTitulo}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Fechar modal"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Conteúdo do Modal - PDF Viewer */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {isLoading ? (
              <div className="w-full h-[calc(90vh-120px)] min-h-[600px] flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando certificado...</p>
                </div>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-[calc(90vh-120px)] min-h-[600px] border-0"
                title="Visualização do Certificado"
              />
            ) : (
              <div className="w-full h-[calc(90vh-120px)] min-h-[600px] flex items-center justify-center">
                <p className="text-gray-600">Erro ao carregar certificado</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer do Modal */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
