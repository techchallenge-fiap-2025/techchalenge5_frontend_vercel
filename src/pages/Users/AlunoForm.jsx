import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiSearch, FiUpload, FiX, FiEye, FiEyeOff } from "react-icons/fi";
import { PageHeader } from "../../components/ui/PageHeader";
import { showSuccessToast, showErrorToast, showWarningToast } from "../../components/feedback/toastConfig";
import alunoService from "../../services/aluno.service";
import responsavelService from "../../services/responsavel.service";
import api from "../../services/api";

export function AlunoForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = id && id !== "novo";
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [responsaveis, setResponsaveis] = useState([]);
  const [searchResponsavel, setSearchResponsavel] = useState("");
  const [showResponsavelDropdown, setShowResponsavelDropdown] = useState(false);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [originalFotoUrl, setOriginalFotoUrl] = useState(null);
  const [originalFotoPublicId, setOriginalFotoPublicId] = useState(null);
  const [originalUserId, setOriginalUserId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmarSenha: "",
    idade: "",
    cpf: "",
    cep: "", // CEP para busca do endereço
    cepEndereco: "", // CEP do endereço do aluno (será salvo)
    endereco: {
      rua: "",
      numero: "",
      bairro: "",
      cidade: "",
      estado: "",
      pais: "Brasil",
    },
    responsaveisIds: [], // Array para múltiplos responsáveis
  });

  // Buscar responsáveis ao carregar
  useEffect(() => {
    const fetchResponsaveis = async () => {
      const result = await responsavelService.getAll();
      if (result.success) {
        setResponsaveis(result.data || []);
      }
    };
    fetchResponsaveis();
  }, []);

  // Carregar dados do aluno se estiver em modo de edição
  useEffect(() => {
    const loadAlunoData = async () => {
      if (!isEditMode || !id) return;

      setLoadingData(true);
      try {
        const result = await alunoService.getById(id);
        if (result.success && result.data) {
          const aluno = result.data;
          const user = aluno.userId || {};
          const endereco = user.endereco || {};
          
          // Carregar CEP do endereço (remover formatação para exibir)
          let cepEndereco = endereco.cep || "";
          // Remover formatação do CEP se existir (formato: 12345-678)
          let cepEnderecoClean = cepEndereco.replace(/\D/g, "");
          // Aplicar formatação novamente
          if (cepEnderecoClean.length === 8) {
            cepEndereco = cepEnderecoClean.replace(/(\d{5})(\d{3})/, "$1-$2");
          }
          
          const alunoData = {
            name: user.name || "",
            email: user.email || "",
            password: "",
            confirmarSenha: "",
            idade: user.idade?.toString() || "",
            cpf: user.cpf || "",
            cep: "", // Campo de busca (não salvo)
            cepEndereco: cepEndereco, // CEP do endereço (será salvo)
            endereco: {
              rua: endereco.rua || "",
              numero: endereco.numero || "",
              bairro: endereco.bairro || "",
              cidade: endereco.cidade || "",
              estado: endereco.estado || "",
              pais: endereco.pais || "Brasil",
            },
            responsaveisIds: aluno.responsaveis?.map(r => r._id) || [],
          };

          setFormData(alunoData);
          setOriginalData(alunoData);
          
          // Salvar userId original para deletar foto se necessário
          setOriginalUserId(user._id || user.id);
          
          // Se houver foto de perfil, mostrar preview e salvar URL e publicId originais
          if (user.fotoPerfil?.url) {
            setFotoPreview(user.fotoPerfil.url);
            setOriginalFotoUrl(user.fotoPerfil.url);
            setOriginalFotoPublicId(user.fotoPerfil.publicId);
          }
        } else {
          showErrorToast(result.error || "Erro ao carregar dados do aluno");
          navigate("/alunos");
        }
      } catch {
        showErrorToast("Erro ao carregar dados do aluno");
        navigate("/alunos");
      } finally {
        setLoadingData(false);
      }
    };

    loadAlunoData();
  }, [isEditMode, id, navigate]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showResponsavelDropdown && !event.target.closest(".responsavel-dropdown")) {
        setShowResponsavelDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showResponsavelDropdown]);

  // Máscara de CPF
  const formatCPF = (value) => {
    const cpf = value.replace(/\D/g, "");
    return cpf
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  // Máscara de CEP
  const formatCEP = (value) => {
    const cep = value.replace(/\D/g, "");
    return cep.replace(/(\d{5})(\d)/, "$1-$2");
  };

  // Função para comparar arrays (usado para responsaveisIds)
  const arraysEqual = (a, b) => {
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, index) => val === sortedB[index]);
  };

  // Detectar se houve mudanças no formulário
  const hasChanges = useMemo(() => {
    if (!isEditMode || !originalData) return false;

    // Comparar campos básicos
    if (formData.name.trim() !== originalData.name.trim()) return true;
    if (formData.email.trim().toLowerCase() !== originalData.email.trim().toLowerCase()) return true;
    if (formData.idade !== originalData.idade) return true;
    if (formData.cpf.replace(/\D/g, "") !== originalData.cpf.replace(/\D/g, "")) return true;
    if (formData.cepEndereco.replace(/\D/g, "") !== originalData.cepEndereco.replace(/\D/g, "")) return true;
    
    // Comparar senha (só se foi preenchida)
    if (formData.password && formData.password.length > 0) return true;
    
    // Comparar endereço
    if (formData.endereco.rua.trim() !== originalData.endereco.rua.trim()) return true;
    if (formData.endereco.numero.trim() !== originalData.endereco.numero.trim()) return true;
    if (formData.endereco.bairro.trim() !== originalData.endereco.bairro.trim()) return true;
    if (formData.endereco.cidade.trim() !== originalData.endereco.cidade.trim()) return true;
    if (formData.endereco.estado.trim() !== originalData.endereco.estado.trim()) return true;
    
    // Comparar responsáveis
    if (!arraysEqual(formData.responsaveisIds, originalData.responsaveisIds)) return true;
    
    // Comparar foto (se uma nova foi selecionada ou se foi removida)
    if (fotoFile) return true;
    if (originalFotoUrl && !fotoPreview) return true; // Foto foi removida
    if (!originalFotoUrl && fotoPreview) return true; // Nova foto foi adicionada

    return false;
  }, [formData, originalData, fotoFile, fotoPreview, originalFotoUrl, isEditMode]);

  // Buscar CEP via API ViaCEP
  const buscarCEP = async () => {
    const cep = formData.cep.replace(/\D/g, "");
    if (cep.length !== 8) {
      showWarningToast("⚠️ CEP deve conter 8 dígitos");
      return;
    }

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        showWarningToast("⚠️ CEP não existe ou está incorreto");
        setLoadingCep(false);
        return;
      }

      setFormData({
        ...formData,
        cepEndereco: formData.cep, // Copiar CEP buscado para CEP Endereço
        endereco: {
          rua: data.logradouro || "",
          numero: "",
          bairro: data.bairro || "",
          cidade: data.localidade || "",
          estado: data.uf || "",
          pais: "Brasil",
        },
      });
      setLoadingCep(false);
    } catch {
      showWarningToast("⚠️ CEP não existe ou está incorreto");
      setLoadingCep(false);
    }
  };

  // Filtrar responsáveis (excluir os já selecionados e apenas ativos)
  const responsaveisFiltrados = responsaveis.filter((resp) => {
    const nomeMatch = resp.nome.toLowerCase().includes(searchResponsavel.toLowerCase());
    const naoSelecionado = !formData.responsaveisIds.includes(resp._id);
    const estaAtivo = resp.active !== false; // Incluir apenas responsáveis ativos
    return nomeMatch && naoSelecionado && estaAtivo;
  });

  // Selecionar responsável (máximo 2)
  const selecionarResponsavel = (responsavel) => {
    if (formData.responsaveisIds.length >= 2) {
      showWarningToast("⚠️ Máximo de 2 responsáveis permitidos");
      return;
    }
    setFormData({
      ...formData,
      responsaveisIds: [...formData.responsaveisIds, responsavel._id],
    });
    setSearchResponsavel("");
    setShowResponsavelDropdown(false);
  };

  // Remover responsável selecionado
  const removerResponsavel = (responsavelId) => {
    setFormData({
      ...formData,
      responsaveisIds: formData.responsaveisIds.filter((id) => id !== responsavelId),
    });
  };

  // Obter responsáveis selecionados (incluir mesmo se inativo, para não perder a referência)
  const responsaveisSelecionados = responsaveis.filter((resp) =>
    formData.responsaveisIds.includes(resp._id)
  );

  // Upload de foto
  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast("A imagem deve ter no máximo 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        showErrorToast("Por favor, selecione uma imagem");
        return;
      }
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removerFoto = () => {
    setFotoFile(null);
    setFotoPreview(null);
  };

  // Validar senha
  const validarSenha = (senha) => {
    const temMinuscula = /[a-z]/.test(senha);
    const temMaiuscula = /[A-Z]/.test(senha);
    const temNumero = /[0-9]/.test(senha);
    const temEspecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(senha);
    const temMinimo8 = senha.length >= 8;

    return {
      temMinuscula,
      temMaiuscula,
      temNumero,
      temEspecial,
      temMinimo8,
      valida: temMinuscula && temMaiuscula && temNumero && temEspecial && temMinimo8,
    };
  };

  // Calcular força da senha (0-100)
  const calcularForcaSenha = (senha) => {
    if (!senha) return 0;

    const validacao = validarSenha(senha);
    let forca = 0;

    // Cada critério vale pontos
    if (validacao.temMinuscula) forca += 20;
    if (validacao.temMaiuscula) forca += 20;
    if (validacao.temNumero) forca += 20;
    if (validacao.temEspecial) forca += 20;
    if (validacao.temMinimo8) forca += 20;

    // Bônus por tamanho
    if (senha.length >= 12) forca += 10;
    if (senha.length >= 16) forca += 10;

    return Math.min(forca, 100);
  };

  // Obter cor da barra de progresso
  const getCorForcaSenha = (forca) => {
    if (forca < 40) return "bg-red-500";
    if (forca < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  // Obter cor do texto da força da senha
  const getCorTextoForcaSenha = (forca) => {
    if (forca < 40) return "text-red-500";
    if (forca < 70) return "text-yellow-500";
    return "text-green-500";
  };

  // Obter texto da força da senha
  const getTextoForcaSenha = (forca) => {
    if (forca < 40) return "Fraca";
    if (forca < 70) return "Média";
    return "Forte";
  };

  // Validar formulário
  const validarFormulario = () => {
    if (!formData.name.trim()) {
      showWarningToast("⚠️ Campo é obrigatório: Nome");
      return false;
    }
    if (!formData.email.trim()) {
      showWarningToast("⚠️ Campo é obrigatório: Email");
      return false;
    }
    
    // Senha só é obrigatória no modo de criação
    if (!isEditMode && !formData.password) {
      showWarningToast("⚠️ Campo é obrigatório: Senha");
      return false;
    }

    // Validar regras da senha apenas se ela foi preenchida (modo edição) ou obrigatória (modo criação)
    if (formData.password && formData.password.length > 0) {
      const validacaoSenha = validarSenha(formData.password);
      
      if (!validacaoSenha.temMinimo8) {
        showErrorToast("❌ Senha deve ter pelo menos 8 caracteres");
        return false;
      }

      if (!validacaoSenha.valida) {
        showErrorToast("❌ Senha deve ter 1 caracter especial , 1 numero , 1 letra maiuscula e uma minuscula");
        return false;
      }

      if (formData.password !== formData.confirmarSenha) {
        showWarningToast("⚠️ Campo confirmar senha deve conter o mesmo valor que senha");
        return false;
      }
    }
    if (!formData.idade || formData.idade < 0) {
      showWarningToast("⚠️ Campo é obrigatório: Idade");
      return false;
    }
    if (!formData.cpf || formData.cpf.replace(/\D/g, "").length !== 11) {
      showWarningToast("⚠️ Campo é obrigatório: CPF");
      return false;
    }
    if (!formData.cepEndereco || formData.cepEndereco.replace(/\D/g, "").length !== 8) {
      showWarningToast("⚠️ Campo é obrigatório: CEP Endereço");
      return false;
    }
    if (!formData.endereco.rua.trim()) {
      showWarningToast("⚠️ Campo é obrigatório: Rua");
      return false;
    }
    if (!formData.endereco.numero.trim()) {
      showWarningToast("⚠️ Campo é obrigatório: Número");
      return false;
    }
    if (!formData.endereco.bairro.trim()) {
      showWarningToast("⚠️ Campo é obrigatório: Bairro");
      return false;
    }
    if (!formData.endereco.cidade.trim()) {
      showWarningToast("⚠️ Campo é obrigatório: Cidade");
      return false;
    }
    if (!formData.endereco.estado.trim()) {
      showWarningToast("⚠️ Campo é obrigatório: Estado");
      return false;
    }
    if (!formData.responsaveisIds || formData.responsaveisIds.length === 0) {
      showWarningToast("⚠️ Campo é obrigatório: Responsável");
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
      if (isEditMode) {
        // Modo de edição - atualizar aluno
        const alunoData = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          idade: parseInt(formData.idade),
          cpf: formData.cpf.replace(/\D/g, ""),
          cepEndereco: formData.cepEndereco.replace(/\D/g, ""),
          endereco: {
            rua: formData.endereco.rua.trim(),
            numero: formData.endereco.numero.trim(),
            bairro: formData.endereco.bairro.trim(),
            cidade: formData.endereco.cidade.trim(),
            estado: formData.endereco.estado.trim(),
            pais: "Brasil",
          },
          responsaveisIds: formData.responsaveisIds,
        };

        // Incluir senha apenas se foi preenchida
        if (formData.password && formData.password.length > 0) {
          alunoData.password = formData.password;
        }

        const result = await alunoService.update(id, alunoData);

        if (!result.success) {
          // Verificar se é erro de email/CPF duplicado
          const errorMessage = result.error || "Erro ao atualizar aluno";
          const errorLower = errorMessage.toLowerCase();
          if (errorLower.includes("email já cadastrado") || 
              errorLower.includes("cpf já cadastrado") ||
              errorLower.includes("já existe") || 
              errorLower.includes("já cadastrado")) {
            showErrorToast("❌ Email e CPF já cadastrado na base");
          } else {
            showErrorToast(`❌ ${errorMessage}`);
          }
          setLoading(false);
          return;
        }

        const userId = result.data?.userId || originalUserId;

        // Se a foto foi removida (tinha foto original mas não tem preview agora), deletar
        if (originalFotoUrl && !fotoPreview && originalFotoPublicId && userId) {
          try {
            await api.delete(`/upload/profile/${userId}`);
            console.log("✅ Foto removida do Cloudinary e banco de dados");
          } catch (deleteError) {
            console.error("Erro ao deletar foto:", deleteError);
            // Continua mesmo se não conseguir deletar a foto
          }
        }

        // Se houver nova foto, fazer upload
        if (fotoFile && userId) {
          try {
            const formDataUpload = new FormData();
            formDataUpload.append("image", fotoFile);

            await api.upload(`/upload/profile/${userId}`, formDataUpload);
          } catch (uploadError) {
            console.error("Erro ao fazer upload da foto:", uploadError);
            // Continua mesmo se o upload falhar
          }
        }

        showSuccessToast("✅ Aluno atualizado");
        navigate("/alunos");
      } else {
        // Modo de criação - criar novo aluno
        const alunoData = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role: "aluno",
          idade: parseInt(formData.idade),
          cpf: formData.cpf.replace(/\D/g, ""),
          cepEndereco: formData.cepEndereco.replace(/\D/g, ""),
          endereco: {
            rua: formData.endereco.rua.trim(),
            numero: formData.endereco.numero.trim(),
            bairro: formData.endereco.bairro.trim(),
            cidade: formData.endereco.cidade.trim(),
            estado: formData.endereco.estado.trim(),
            pais: "Brasil",
          },
          responsaveisIds: formData.responsaveisIds,
          active: true,
        };

        const result = await alunoService.create(alunoData);

        if (!result.success) {
          // Verificar se é erro de email/CPF duplicado
          const errorMessage = result.error || "Erro ao criar aluno";
          const errorLower = errorMessage.toLowerCase();
          if (errorLower.includes("email já cadastrado") || 
              errorLower.includes("cpf já cadastrado") ||
              errorLower.includes("já existe") || 
              errorLower.includes("já cadastrado")) {
            showErrorToast("❌ Email e CPF já cadastrado na base");
          } else {
            showErrorToast(`❌ ${errorMessage}`);
          }
          setLoading(false);
          return;
        }

        // Se houver foto, fazer upload
        if (fotoFile && result.data?.userId) {
          try {
            const formDataUpload = new FormData();
            formDataUpload.append("image", fotoFile);

            await api.upload(`/upload/profile/${result.data.userId}`, formDataUpload);
          } catch (uploadError) {
            console.error("Erro ao fazer upload da foto:", uploadError);
            // Continua mesmo se o upload falhar
          }
        }

        showSuccessToast("Aluno criado com sucesso!");
        navigate("/alunos");
      }
    } catch (error) {
      showErrorToast(error.message || (isEditMode ? "Erro ao atualizar aluno" : "Erro ao criar aluno"));
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Carregando dados do aluno...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <PageHeader title={isEditMode ? "Editar Aluno" : "Cadastrar Aluno"} />

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            required
          />
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

        {/* Senha e Confirmar Senha */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha {!isEditMode && <span className="text-red-500">*</span>}
              {isEditMode && <span className="text-xs text-gray-500 ml-1">(Deixe em branco para não alterar)</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 pr-8 sm:pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                required={!isEditMode}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
            {/* Barra de progresso da força da senha */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-1">
                  <span className="text-xs text-gray-600">
                    Força da senha: <span className={`font-semibold ${getCorTextoForcaSenha(calcularForcaSenha(formData.password))}`}>
                      {getTextoForcaSenha(calcularForcaSenha(formData.password))}
                    </span>
                  </span>
                  <span className="text-xs text-gray-500">
                    {calcularForcaSenha(formData.password)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getCorForcaSenha(calcularForcaSenha(formData.password))}`}
                    style={{ width: `${calcularForcaSenha(formData.password)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Senha {!isEditMode && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmarSenha}
                onChange={(e) => setFormData({ ...formData, confirmarSenha: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 pr-8 sm:pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                required={!isEditMode}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Idade e CPF */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Idade <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={formData.idade}
              onChange={(e) => setFormData({ ...formData, idade: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              required
            />
          </div>
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
        </div>

        {/* CEP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CEP
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={formData.cep}
              onChange={(e) => {
                const formatted = formatCEP(e.target.value);
                if (formatted.replace(/\D/g, "").length <= 8) {
                  setFormData({ ...formData, cep: formatted });
                }
              }}
              placeholder="00000-000"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={buscarCEP}
              disabled={loadingCep}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <FiSearch size={18} />
              <span className="hidden sm:inline">{loadingCep ? "Buscando..." : "Buscar"}</span>
              <span className="sm:hidden">{loadingCep ? "..." : "Buscar"}</span>
            </button>
          </div>
        </div>

        {/* Endereço */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rua <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.endereco.rua}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  endereco: { ...formData.endereco, rua: e.target.value },
                })
              }
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.endereco.numero}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  endereco: { ...formData.endereco, numero: e.target.value },
                })
              }
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bairro <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.endereco.bairro}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  endereco: { ...formData.endereco, bairro: e.target.value },
                })
              }
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cidade <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.endereco.cidade}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  endereco: { ...formData.endereco, cidade: e.target.value },
                })
              }
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.endereco.estado}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  endereco: { ...formData.endereco, estado: e.target.value },
                })
              }
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CEP Endereço <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.cepEndereco}
              onChange={(e) => {
                const formatted = formatCEP(e.target.value);
                if (formatted.replace(/\D/g, "").length <= 8) {
                  setFormData({ ...formData, cepEndereco: formatted });
                }
              }}
              placeholder="00000-000"
              className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              País
            </label>
            <input
              type="text"
              value={formData.endereco.pais}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Responsáveis */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Responsáveis <span className="text-red-500">*</span>
            <span className="text-xs text-gray-500 ml-1 sm:ml-2">(Máximo 2)</span>
          </label>
          
          {/* Responsáveis selecionados */}
          {responsaveisSelecionados.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {responsaveisSelecionados.map((resp) => (
                <div
                  key={resp._id}
                  className="inline-flex items-center gap-1 sm:gap-2 bg-orange-100 text-orange-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm"
                >
                  <span className="truncate max-w-[120px] sm:max-w-none">{resp.nome}</span>
                  <button
                    type="button"
                    onClick={() => removerResponsavel(resp._id)}
                    className="hover:text-red-600 transition-colors shrink-0"
                  >
                    <FiX size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Campo de busca */}
          {responsaveisSelecionados.length < 2 && (
            <div className="relative responsavel-dropdown">
              <input
                type="text"
                value={searchResponsavel}
                onChange={(e) => {
                  setSearchResponsavel(e.target.value);
                  setShowResponsavelDropdown(true);
                }}
                onFocus={() => setShowResponsavelDropdown(true)}
                placeholder={
                  responsaveisSelecionados.length === 0
                    ? "Buscar responsável..."
                    : "Buscar segundo responsável..."
                }
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              />
              {showResponsavelDropdown && responsaveisFiltrados.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {responsaveisFiltrados.map((resp) => (
                    <div
                      key={resp._id}
                      onClick={() => selecionarResponsavel(resp)}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {resp.nome}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Foto de Perfil */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Foto de Perfil
          </label>
          {fotoPreview ? (
            <div className="relative inline-block">
              <img
                src={fotoPreview}
                alt="Preview"
                className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg border border-gray-300"
              />
              <button
                type="button"
                onClick={removerFoto}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <FiX size={14} className="sm:w-4 sm:h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-24 h-24 sm:w-32 sm:h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-500 transition-colors">
              <FiUpload size={20} className="sm:w-6 sm:h-6 text-gray-400 mb-1 sm:mb-2" />
              <span className="text-xs sm:text-sm text-gray-600">Upload</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Botões */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate("/alunos")}
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
