import { Pagination } from "../../components/ui/Pagination";
import { PageHeader } from "../../components/ui/PageHeader";
import { ExpandButton } from "../../components/ui/ExpandButton";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { ActionButtons } from "../../components/ui/ActionButtons";
import { DateCell } from "../../components/ui/DateCell";
import { AlunoCard } from "../../components/ui/AlunoCard";
import { ResponsavelFilters } from "../../components/ui/ResponsavelFilters";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import { FiSearch } from "react-icons/fi";
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import responsavelService from "../../services/responsavel.service";
import { showConfirmDeleteToast, showSuccessToast, showErrorToast } from "../../components/feedback/toastConfig";

// Função para formatar data
const formatDate = (dateString) => {
  if (!dateString) return { data: "-", hora: "-" };
  const date = new Date(dateString);
  const options = { month: "short", day: "numeric", year: "numeric" };
  const data = date.toLocaleDateString("pt-BR", options);
  const hora = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return { data, hora };
};

// Função para transformar dados da API para o formato da tabela
const transformResponsavelData = (responsavel) => {
  // Usar os últimos 6 caracteres do _id do Responsável como ID curto
  const shortId = responsavel._id ? `#${responsavel._id.toString().slice(-6)}` : "#N/A";
  
  // Transformar alunos para o formato esperado pelo AlunoCard
  const alunosTransformados = (responsavel.alunos || []).map((aluno) => {
    const alunoId = aluno._id ? `#${aluno._id.toString().slice(-6)}` : "#N/A";
    return {
      id: alunoId,
      fotoPerfil: aluno.userId?.fotoPerfil,
      nome: aluno.userId?.name || "Sem nome",
      email: aluno.userId?.email || "-",
      status: aluno.status || "ativo",
    };
  });
  
  return {
    id: shortId,
    _id: responsavel._id,
    nome: responsavel.nome || "Sem nome",
    status: responsavel.active ? "ativo" : "inativo",
    criado: formatDate(responsavel.createdAt),
    modificado: formatDate(responsavel.updatedAt),
    alunos: alunosTransformados,
  };
};

const columns = [
  { key: "expand", label: "" },
  { key: "id", label: "Resp Id" },
  { key: "responsavel", label: "Responsavel" },
  { key: "status", label: "Status" },
  { key: "criado", label: "Criado", hiddenMobile: true },
  { key: "modificado", label: "Modificado", hiddenMobile: true },
  { key: "acoes", label: "Ações" },
];

export function ResponsaveisPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [responsaveis, setResponsaveis] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ ordem: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchResponsaveis = async () => {
      if (user?.role === "admin") {
        setIsLoading(true);
        const startTime = Date.now();
        
        const result = await responsavelService.getAll(filters);
        
        // Garantir que o loading seja exibido por pelo menos 1,5 segundos
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 1500; // 1,5 segundos
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
        
        if (result.success) {
          const transformedData = result.data.map(transformResponsavelData);
          setResponsaveis(transformedData);
        }
        setIsLoading(false);
      }
    };

    fetchResponsaveis();
  }, [user, filters]);

  // Filtrar responsáveis baseado no termo de busca
  const filteredResponsaveis = responsaveis.filter((responsavel) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      responsavel.nome.toLowerCase().includes(searchLower) ||
      responsavel.id.toLowerCase().includes(searchLower)
    );
  });

  // Calcular paginação
  const totalPages = Math.ceil(filteredResponsaveis.length / itemsPerPage);
  const validPage = useMemo(() => {
    if (totalPages === 0) return 1;
    return Math.min(currentPage, totalPages);
  }, [currentPage, totalPages]);

  const startIndex = (validPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredResponsaveis.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const toggleExpand = (index) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      // Se já está expandido, fecha
      newExpanded.delete(index);
    } else {
      // Se não está expandido, fecha todas as outras e abre apenas esta
      newExpanded.clear();
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const handleDelete = (responsavel) => {
    showConfirmDeleteToast(
      `🗑️ Deseja deletar o responsavel: ${responsavel.nome}?`,
      async () => {
        try {
          const result = await responsavelService.delete(responsavel._id);
          if (result.success) {
            showSuccessToast("✅ Responsável deletado com sucesso");
            // Recarregar a lista de responsáveis
            const resultList = await responsavelService.getAll();
            if (resultList.success) {
              const transformedData = resultList.data.map(transformResponsavelData);
              setResponsaveis(transformedData);
            }
          } else {
            showErrorToast(result.error || "Erro ao deletar responsável");
          }
        } catch (error) {
          showErrorToast("Erro ao deletar responsável. Tente novamente.");
        }
      },
      () => {
        // Cancelar - não fazer nada
      }
    );
  };

  return (
    <div className="space-y-8">
      {isLoading && <LoadingScreen />}
      <PageHeader
        title="Responsaveis"
        buttonText="Adicionar Responsável"
        onButtonClick={() => navigate("/responsaveis/novo")}
      />
      <div className="flex items-center justify-end gap-4">
        <div className="w-[20%]">
          <div className="relative w-full bg-white rounded-lg">
            <input
              type="text"
              placeholder="Buscar ..."
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Resetar para primeira página ao buscar
              }}
              className="w-full px-4 py-2 pr-10 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-dark text-sm sm:text-base"
            />
            <FiSearch
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-500 transition-colors cursor-pointer"
              size={18}
            />
          </div>
        </div>
        <ResponsavelFilters onFilterChange={setFilters} />
      </div>
      <section>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Carregando responsáveis...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-orange-500 overflow-hidden shadow-sm">
            {/* Tabela */}
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* Cabeçalho */}
                <thead>
                  <tr className="bg-orange-500">
                    {columns.map((column, index) => (
                      <th
                        key={index}
                        className={`px-2 sm:px-4 py-2 sm:py-3 text-left text-white font-bold text-xs sm:text-sm whitespace-nowrap ${
                          column.hiddenMobile ? "hidden lg:table-cell" : ""
                        }`}
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Corpo da tabela */}
                <tbody>
                  {currentData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Nenhum dado encontrado
                    </td>
                  </tr>
                ) : (
                  currentData.map((row, rowIndex) => {
                    const isExpanded = expandedRows.has(rowIndex);
                    const temAlunos = row.alunos && row.alunos.length > 0;
                    return (
                      <>
                        <tr
                          key={rowIndex}
                          onClick={() => navigate(`/responsaveis/${row._id}`)}
                          className="border-b border-orange-300 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          {/* Botão de expandir - só aparece se houver alunos */}
                          <td 
                            className="px-2 sm:px-4 py-2 sm:py-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {temAlunos ? (
                              <ExpandButton
                                isExpanded={isExpanded}
                                onClick={() => toggleExpand(rowIndex)}
                              />
                            ) : (
                              <span className="w-6 h-6 inline-block"></span>
                            )}
                          </td>
                          {/* Resp Id */}
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-dark text-xs sm:text-sm">
                            <span className="font-medium">{row.id}</span>
                          </td>
                          {/* Responsavel */}
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-dark text-xs sm:text-sm">
                            <span className="font-bold text-orange-500">{row.nome}</span>
                          </td>
                          {/* Status */}
                          <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm">
                            <StatusBadge status={row.status} />
                          </td>
                          {/* Criado */}
                          <td className={`px-2 sm:px-4 py-2 sm:py-3 text-gray-dark text-xs sm:text-sm hidden lg:table-cell`}>
                            <DateCell data={row.criado.data} hora={row.criado.hora} />
                          </td>
                          {/* Modificado */}
                          <td className={`px-2 sm:px-4 py-2 sm:py-3 text-gray-dark text-xs sm:text-sm hidden lg:table-cell`}>
                            <DateCell data={row.modificado.data} hora={row.modificado.hora} />
                          </td>
                          {/* Ações */}
                          <td 
                            className="px-2 sm:px-4 py-2 sm:py-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ActionButtons
                              onEdit={() => navigate(`/responsaveis/${row._id}/editar`)}
                              onDelete={() => handleDelete(row)}
                            />
                          </td>
                        </tr>
                        {/* Linha expandida com alunos - só aparece se houver alunos e estiver expandido */}
                        {isExpanded && temAlunos && (
                          <tr key={`expanded-${rowIndex}`} className="bg-gray-50">
                            <td colSpan={columns.length} className="px-2 sm:px-4 py-4">
                              <div className="space-y-2 animate-fade-in">
                                {row.alunos.map((aluno, alunoIndex) => (
                                  <AlunoCard key={alunoIndex} aluno={aluno} />
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

            {/* Paginação */}
            {totalPages > 0 && (
              <Pagination
                currentPage={validPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
