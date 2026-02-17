import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { PageHeader } from "../../components/ui/PageHeader";
import { Pagination } from "../../components/ui/Pagination";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { ActionButtons } from "../../components/ui/ActionButtons";
import { DateCell } from "../../components/ui/DateCell";
import { TurmaFilters } from "../../components/ui/TurmaFilters";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import { useAuth } from "../../context/AuthContext";
import turmaService from "../../services/turma.service";
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
const transformTurmaData = (turma) => {
  // Usar os últimos 6 caracteres do _id da Turma como ID curto
  const shortId = turma._id ? `#${turma._id.toString().slice(-6)}` : "#N/A";
  
  return {
    id: shortId,
    _id: turma._id,
    nome: turma.nome || "Sem nome",
    anoLetivo: turma.anoLetivo || "",
    status: turma.status || "ativa",
    criado: formatDate(turma.createdAt),
  };
};

// Colunas da tabela - admin vê todas, professor não vê ações
const getColumns = (userRole) => {
  const baseColumns = [
    { key: "id", label: "Turma Id" },
    { key: "nome", label: "Turma" },
    { key: "status", label: "Status" },
    { key: "criado", label: "Criado", hiddenMobile: true },
  ];
  
  // Apenas admin vê coluna de ações
  if (userRole === "admin") {
    baseColumns.push({ key: "acoes", label: "Ações" });
  }
  
  return baseColumns;
};

export function TurmasPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [turmas, setTurmas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ ordem: null, status: null, nivelEducacional: null, anoLetivo: null, periodo: null });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Obter colunas baseado no role do usuário
  const columns = getColumns(user?.role);

  useEffect(() => {
    const fetchTurmas = async () => {
      setIsLoading(true);
      const startTime = Date.now();
      
      if (user?.role === "admin") {
        // Admin vê todas as turmas com filtros
        const result = await turmaService.getAll(filters);
        
        // Garantir que o loading seja exibido por pelo menos 1,5 segundos
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 1500; // 1,5 segundos
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
        
        if (result.success) {
          const transformedData = result.data.map(transformTurmaData);
          setTurmas(transformedData);
        }
      } else if (user?.role === "professor") {
        // Professor vê apenas suas turmas usando endpoint específico
        try {
          const result = await turmaService.getMinhasTurmas();
          
          // Garantir que o loading seja exibido por pelo menos 1,5 segundos
          const elapsedTime = Date.now() - startTime;
          const minLoadingTime = 1500; // 1,5 segundos
          const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
          
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
          
          if (result.success && result.data) {
            const transformedData = Array.isArray(result.data) 
              ? result.data.map(transformTurmaData)
              : [];
            setTurmas(transformedData);
          } else {
            setTurmas([]);
          }
        } catch (error) {
          console.error("Erro ao buscar turmas do professor:", error);
          setTurmas([]);
        }
      }
      
      setIsLoading(false);
    };

    fetchTurmas();
  }, [user, filters]);

  // Filtrar turmas baseado no termo de busca
  const filteredTurmas = turmas.filter((turma) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      turma.nome.toLowerCase().includes(searchLower) ||
      turma.id.toLowerCase().includes(searchLower) ||
      turma.status.toLowerCase().includes(searchLower)
    );
  });

  // Calcular paginação
  const totalPages = Math.ceil(filteredTurmas.length / itemsPerPage);
  const validPage = useMemo(() => {
    if (totalPages === 0) return 1;
    return Math.min(currentPage, totalPages);
  }, [currentPage, totalPages]);

  const startIndex = (validPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredTurmas.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDelete = (turma) => {
    const nomeCompleto = turma.anoLetivo 
      ? `${turma.nome} ${turma.anoLetivo}`
      : turma.nome;
    
    showConfirmDeleteToast(
      `🗑️ Deseja deletar a turma: ${nomeCompleto}?`,
      async () => {
        try {
          const result = await turmaService.delete(turma._id);
          if (result.success) {
            showSuccessToast("✅ Turma deletada com sucesso");
            // Recarregar a lista de turmas
            if (user?.role === "admin") {
              const resultList = await turmaService.getAll();
              if (resultList.success) {
                const transformedData = resultList.data.map(transformTurmaData);
                setTurmas(transformedData);
              }
            } else if (user?.role === "professor") {
              // Recarregar turmas do professor usando endpoint específico
              const resultList = await turmaService.getMinhasTurmas();
              if (resultList.success) {
                const transformedData = Array.isArray(resultList.data) 
                  ? resultList.data.map(transformTurmaData)
                  : [];
                setTurmas(transformedData);
              }
            }
          } else {
            showErrorToast(result.error || "Erro ao deletar turma");
          }
        } catch (error) {
          showErrorToast("Erro ao deletar turma. Tente novamente.");
        }
      },
      () => {
        // Cancelar - não fazer nada
      }
    );
  };

  const renderCell = (key, row) => {
    switch (key) {
      case "id":
        return <span className="font-medium">{row.id}</span>;
      
      case "nome":
        return <span>{row.nome}</span>;
      
      case "status":
        return <StatusBadge status={row.status} />;
      
      case "criado":
        return <DateCell data={row.criado.data} hora={row.criado.hora} />;
      
      case "acoes":
        // Professor não pode editar ou deletar turmas, apenas visualizar
        if (user?.role === "professor") {
          return null;
        }
        return (
          <ActionButtons
            onEdit={() => navigate(`/turmas/${row._id}/editar`)}
            onDelete={() => handleDelete(row)}
          />
        );
      
      default:
        return row[key];
    }
  };

  return (
    <div className="space-y-8">
      {isLoading && <LoadingScreen />}
      <PageHeader
        title="Turmas"
        buttonText={user?.role === "admin" ? "Adicionar Turma" : undefined}
        onButtonClick={user?.role === "admin" ? () => navigate("/turmas/novo") : undefined}
      />
      {user?.role === "admin" && (
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
          <TurmaFilters onFilterChange={setFilters} />
        </div>
      )}
      {user?.role === "professor" && (
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
        </div>
      )}
      <section>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Carregando turmas...</p>
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
                    currentData.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        onClick={() => navigate(`/turmas/${row._id}`)}
                        className="border-b border-orange-300 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        {columns.map((column, colIndex) => (
                          <td
                            key={colIndex}
                            className={`px-2 sm:px-4 py-2 sm:py-3 text-gray-dark text-xs sm:text-sm ${
                              column.hiddenMobile ? "hidden lg:table-cell" : ""
                            }`}
                            onClick={(e) => {
                              // Se clicar nos botões de ação, não navegar
                              if (column.key === "acoes") {
                                e.stopPropagation();
                              }
                            }}
                          >
                            {renderCell(column.key, row, rowIndex)}
                          </td>
                        ))}
                      </tr>
                    ))
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
