import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { PageHeader } from "../../components/ui/PageHeader";
import { showSuccessToast, showErrorToast, showWarningToast } from "../../components/feedback/toastConfig";
import responsavelService from "../../services/responsavel.service";

export function ResponsavelForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = id && id !== "novo";
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [searchParentesco, setSearchParentesco] = useState("");
  const [showParentescoDropdown, setShowParentescoDropdown] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    email: "",
    parentesco: "",
  });

  const parentescos = [
    { value: "pai", label: "Pai" },
    { value: "mãe", label: "Mãe" },
    { value: "avo", label: "Avô/Avó" },
    { value: "irmao", label: "Irmão/Irmã" },
    { value: "tutor", label: "Tutor" },
    { value: "outro", label: "Outro" },
  ];

  // Máscara de CPF
  const formatCPF = (value) => {
    if (!value) return "";
    const cpf = value.replace(/\D/g, "");
    return cpf
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  // Máscara de telefone
  const formatTelefone = (value) => {
    if (!value) return "";
    const telefone = value.replace(/\D/g, "");
    if (telefone.length <= 10) {
      return telefone.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    } else {
      return telefone.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
    }
  };

  // Carregar dados do responsável se estiver em modo de edição
  useEffect(() => {
    const loadResponsavelData = async () => {
      if (!isEditMode || !id) return;

      setLoadingData(true);
      try {
        const result = await responsavelService.getById(id);
        if (result.success && result.data) {
          const responsavel = result.data;
          
          const responsavelData = {
            nome: responsavel.nome || "",
            cpf: responsavel.cpf || "",
            telefone: responsavel.telefone || "",
            email: responsavel.email || "",
            parentesco: responsavel.parentesco || "",
          };

          // Aplicar formatação ao CPF e telefone
          if (responsavelData.cpf) {
            responsavelData.cpf = formatCPF(responsavelData.cpf);
          }
          if (responsavelData.telefone) {
            responsavelData.telefone = formatTelefone(responsavelData.telefone);
          }

          setFormData(responsavelData);
          setOriginalData(responsavelData);
        } else {
          showErrorToast(result.error || "Erro ao carregar dados do responsável");
          navigate("/responsaveis");
        }
      } catch {
        showErrorToast("Erro ao carregar dados do responsável");
        navigate("/responsaveis");
      } finally {
        setLoadingData(false);
      }
    };

    loadResponsavelData();
  }, [isEditMode, id, navigate]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showParentescoDropdown && !event.target.closest(".parentesco-dropdown")) {
        setShowParentescoDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showParentescoDropdown]);

  // Filtrar parentescos baseado na busca
  const parentescosFiltrados = parentescos.filter((parentesco) => {
    const labelMatch = parentesco.label.toLowerCase().includes(searchParentesco.toLowerCase());
    return labelMatch;
  });

  // Selecionar parentesco
  const selecionarParentesco = (parentesco) => {
    setFormData({ ...formData, parentesco: parentesco.value });
    setSearchParentesco("");
    setShowParentescoDropdown(false);
  };

  // Remover parentesco selecionado
  const removerParentesco = () => {
    setFormData({ ...formData, parentesco: "" });
    setSearchParentesco("");
  };

  // Obter label do parentesco selecionado
  const parentescoSelecionado = parentescos.find((p) => p.value === formData.parentesco);

  // Detectar se houve mudanças no formulário
  const hasChanges = useMemo(() => {
    if (!isEditMode || !originalData) return false;

    // Comparar campos
    if (formData.nome.trim() !== originalData.nome.trim()) return true;
    if (formData.cpf.replace(/\D/g, "") !== originalData.cpf.replace(/\D/g, "")) return true;
    if (formData.telefone.replace(/\D/g, "") !== originalData.telefone.replace(/\D/g, "")) return true;
    if (formData.email.trim().toLowerCase() !== originalData.email.trim().toLowerCase()) return true;
    if (formData.parentesco !== originalData.parentesco) return true;

    return false;
  }, [formData, originalData, isEditMode]);

  // Validar formulário
  const validarFormulario = () => {
    // Verificar se todos os campos estão vazios
    const todosVazios = 
      !formData.nome.trim() &&
      (!formData.cpf || formData.cpf.replace(/\D/g, "").length === 0) &&
      (!formData.telefone || formData.telefone.replace(/\D/g, "").length === 0) &&
      !formData.email.trim() &&
      !formData.parentesco;

    if (todosVazios) {
      showErrorToast("❌ Todos os campos são obrigatórios");
      return false;
    }

    // Validar campos individuais
    if (!formData.nome.trim()) {
      showErrorToast("❌ Todos os campos são obrigatórios");
      return false;
    }
    if (!formData.cpf || formData.cpf.replace(/\D/g, "").length !== 11) {
      showErrorToast("❌ Todos os campos são obrigatórios");
      return false;
    }
    if (!formData.telefone || formData.telefone.replace(/\D/g, "").length < 10) {
      showErrorToast("❌ Todos os campos são obrigatórios");
      return false;
    }
    if (!formData.email.trim()) {
      showErrorToast("❌ Todos os campos são obrigatórios");
      return false;
    }
    if (!formData.parentesco || formData.parentesco.trim() === "") {
      showErrorToast("❌ Todos os campos são obrigatórios");
      return false;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      showWarningToast("⚠️ Email inválido");
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

    // No modo de edição, verificar se há mudanças
    if (isEditMode && !hasChanges) {
      showWarningToast("⚠️ Nenhuma alteração foi feita");
      return;
    }

    setLoading(true);

    try {
      const responsavelData = {
        nome: formData.nome.trim(),
        cpf: formData.cpf.replace(/\D/g, ""),
        telefone: formData.telefone.replace(/\D/g, ""),
        email: formData.email.trim().toLowerCase(),
        parentesco: formData.parentesco,
      };

      let result;
      if (isEditMode) {
        result = await responsavelService.update(id, responsavelData);
      } else {
        responsavelData.active = true; // Sempre ativo ao criar
        result = await responsavelService.create(responsavelData);
      }

      if (!result.success) {
        const errorMessage = result.error || (isEditMode ? "Erro ao atualizar responsável" : "Erro ao criar responsável");
        const errorLower = errorMessage.toLowerCase();

        // Tratar erros específicos do backend
        if (errorLower.includes("cpf já está cadastrado") || 
            errorLower.includes("o cpf já está cadastrado")) {
          showErrorToast("❌ O CPF já está cadastrado no sistema");
        } else if (errorLower.includes("telefone já cadastrado")) {
          showErrorToast("❌ Telefone já cadastrado no sisitema");
        } else if (errorLower.includes("e-mail já cadastrado") ||
                   errorLower.includes("email já cadastrado")) {
          showErrorToast("❌ E-mail já cadastrado no sistema");
        } else if (errorLower.includes("todos os campos são obrigatórios")) {
          showErrorToast("❌ Todos os campos são obrigatórios");
        } else {
          showErrorToast(`❌ ${errorMessage}`);
        }
        setLoading(false);
        return;
      }

      showSuccessToast(isEditMode ? "✅ Responsável atualizado com sucesso!" : "✅ Responsável criado com sucesso!");
      navigate("/responsaveis");
    } catch (error) {
      showErrorToast(error.message || (isEditMode ? "Erro ao atualizar responsável" : "Erro ao criar responsável"));
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
        <PageHeader title={isEditMode ? "Editar Responsável" : "Cadastrar Responsável"} />
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="text-center py-8">
            <p className="text-gray-600">Carregando dados do responsável...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <PageHeader title={isEditMode ? "Editar Responsável" : "Cadastrar Responsável"} />

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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
        </div>

        {/* CPF e Telefone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CPF <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.cpf}
              onChange={(e) => {
                const formatted = formatCPF(e.target.value);
                if (formatted.replace(/\D/g, "").length <= 11) {
                  setFormData({ ...formData, cpf: formatted });
                }
              }}
              placeholder="000.000.000-00"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.telefone}
              onChange={(e) => {
                const formatted = formatTelefone(e.target.value);
                if (formatted.replace(/\D/g, "").length <= 11) {
                  setFormData({ ...formData, telefone: formatted });
                }
              }}
              placeholder="(00) 00000-0000"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
        </div>

        {/* Parentesco */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Parentesco <span className="text-red-500">*</span>
          </label>
          
          {/* Parentesco selecionado */}
          {parentescoSelecionado && (
            <div className="flex flex-wrap gap-2 mb-2">
              <div className="inline-flex items-center gap-1 sm:gap-2 bg-orange-100 text-orange-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                <span className="truncate max-w-[120px] sm:max-w-none">{parentescoSelecionado.label}</span>
                <button
                  type="button"
                  onClick={removerParentesco}
                  className="hover:text-red-600 transition-colors shrink-0"
                >
                  <FiX size={14} className="sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Campo de busca */}
          {!parentescoSelecionado && (
            <div className="relative parentesco-dropdown">
              <input
                type="text"
                value={searchParentesco}
                onChange={(e) => {
                  setSearchParentesco(e.target.value);
                  setShowParentescoDropdown(true);
                }}
                onFocus={() => setShowParentescoDropdown(true)}
                placeholder="Buscar parentesco..."
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                required={!parentescoSelecionado}
              />
              {showParentescoDropdown && parentescosFiltrados.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {parentescosFiltrados.map((parentesco) => (
                    <div
                      key={parentesco.value}
                      onClick={() => selecionarParentesco(parentesco)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {parentesco.label}
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
            onClick={() => navigate("/responsaveis")}
            className="w-full sm:w-auto px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || (isEditMode && !hasChanges)}
            className="w-full sm:w-auto px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (isEditMode ? "Atualizando..." : "Salvando...") : (isEditMode ? "Atualizar" : "Salvar")}
          </button>
        </div>
      </form>
    </div>
  );
}
