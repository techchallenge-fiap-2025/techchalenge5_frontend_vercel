import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import { showSuccessToast, showErrorToast, showWarningToast } from "../../components/feedback/toastConfig";
import materiaService from "../../services/materia.service";

export function MateriaForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
  });

  // Validar formulário
  const validarFormulario = () => {
    if (!formData.nome || !formData.nome.trim()) {
      showErrorToast("❌ Nome não pode ser vazio");
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
      const materiaData = {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || "",
      };

      const result = await materiaService.create(materiaData);

      if (!result.success) {
        const errorMessage = result.error || "Erro ao criar matéria";
        const errorLower = errorMessage.toLowerCase();
        
        // Verificar se é erro de matéria duplicada
        if (errorLower.includes("já existe") || errorLower.includes("já cadastrado")) {
          // Extrair o nome da matéria da mensagem de erro ou usar o nome do formulário
          const nomeMateria = formData.nome.trim();
          showWarningToast(`⚠️ Materia ${nomeMateria} já cadastrado`);
        } else {
          showErrorToast(`❌ ${errorMessage}`);
        }
        setLoading(false);
        return;
      }

      showSuccessToast("✅ Matéria criada com sucesso!");
      navigate("/materias");
    } catch (error) {
      showErrorToast(error.message || "Erro ao criar matéria");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <PageHeader title="Cadastrar Matéria" />

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
            placeholder="Digite o nome da matéria"
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
            placeholder="Digite a descrição da matéria"
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Botões */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/materias")}
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
