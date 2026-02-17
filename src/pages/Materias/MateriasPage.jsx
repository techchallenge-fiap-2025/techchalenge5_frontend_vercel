import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { PageHeader } from "../../components/ui/PageHeader";
import { Pagination } from "../../components/ui/Pagination";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { ActionButtons } from "../../components/ui/ActionButtons";
import { DateCell } from "../../components/ui/DateCell";
import { MateriaFilters } from "../../components/ui/MateriaFilters";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import { useAuth } from "../../context/AuthContext";
import materiaService from "../../services/materia.service";
import {
  showConfirmDeleteToast,
  showSuccessToast,
  showErrorToast,
} from "../../components/feedback/toastConfig";

// Função para formatar data
const formatDate = (dateString) => {
  if (!dateString) return { data: "-", hora: "-" };
  const date = new Date(dateString);
  const options = { month: "short", day: "numeric", year: "numeric" };
  const data = date.toLocaleDateString("pt-BR", options);
  const hora = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { data, hora };
};

// Função para transformar dados da API para o formato da tabela
const transformMateriaData = (materia) => {
  // Usar os últimos 6 caracteres do _id da Matéria como ID curto
  const shortId = materia._id ? `#${materia._id.toString().slice(-6)}` : "#N/A";

  return {
    id: shortId,
    _id: materia._id,
    nome: materia.nome || "Sem nome",
    status: materia.status || "ativa",
    criado: formatDate(materia.createdAt),
  };
};

// Colunas da tabela - admin vê todas, professor não vê ações
const getColumns = (userRole) => {
  const baseColumns = [
    { key: "id", label: "Materia Id" },
    { key: "nome", label: "Materia" },
    { key: "status", label: "Status" },
    { key: "criado", label: "Criado", hiddenMobile: true },
  ];

  // Apenas admin vê coluna de ações
  if (userRole === "admin") {
    baseColumns.push({ key: "acoes", label: "Ações" });
  }

  return baseColumns;
};

export function MateriasPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [materias, setMaterias] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ ordem: null, status: null });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Obter colunas baseado no role do usuário
  const columns = getColumns(user?.role);

  useEffect(() => {
    const fetchMaterias = async () => {
      setIsLoading(true);
      const startTime = Date.now();

      if (user?.role === "admin") {
        // Admin vê todas as matérias com filtros
        const result = await materiaService.getAll(filters);
        
        // Garantir que o loading seja exibido por pelo menos 1,5 segundos
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 1500; // 1,5 segundos
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
        
        if (result.success) {
          const transformedData = result.data.map(transformMateriaData);
          setMaterias(transformedData);
        }
      } else if (user?.role === "professor") {
        // Professor vê apenas suas matérias usando endpoint específico
        try {
          const result = await materiaService.getMinhasMaterias();
          
          // Garantir que o loading seja exibido por pelo menos 1,5 segundos
          const elapsedTime = Date.now() - startTime;
          const minLoadingTime = 1500; // 1,5 segundos
          const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
          
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
          
          if (result.success && result.data) {
            const transformedData = Array.isArray(result.data)
              ? result.data.map(transformMateriaData)
              : [];
            setMaterias(transformedData);
          } else {
            setMaterias([]);
          }
        } catch (error) {
          console.error("Erro ao buscar matérias do professor:", error);
          setMaterias([]);
        }
      }

      setIsLoading(false);
    };

    fetchMaterias();
  }, [user, filters]);

  // Filtrar matérias baseado no termo de busca
  const filteredMaterias = materias.filter((materia) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      materia.nome.toLowerCase().includes(searchLower) ||
      materia.id.toLowerCase().includes(searchLower) ||
      materia.status.toLowerCase().includes(searchLower)
    );
  });

  // Calcular paginação
  const totalPages = Math.ceil(filteredMaterias.length / itemsPerPage);
  const validPage = useMemo(() => {
    if (totalPages === 0) return 1;
    return Math.min(currentPage, totalPages);
  }, [currentPage, totalPages]);

  const startIndex = (validPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredMaterias.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleDelete = (materia) => {
    showConfirmDeleteToast(
      `🗑️ Deseja deletar a materia: ${materia.nome}?`,
      async () => {
        try {
          const result = await materiaService.delete(materia._id);
          if (result.success) {
            showSuccessToast("✅ Matéria deletada com sucesso");
            // Recarregar a lista de matérias
            if (user?.role === "admin") {
              const resultList = await materiaService.getAll();
              if (resultList.success) {
                const transformedData =
                  resultList.data.map(transformMateriaData);
                setMaterias(transformedData);
              }
            } else if (user?.role === "professor") {
              // Recarregar matérias do professor usando endpoint específico
              const resultList = await materiaService.getMinhasMaterias();
              if (resultList.success) {
                const transformedData = (resultList.data || []).map(
                  transformMateriaData,
                );
                setMaterias(transformedData);
              } else {
                setMaterias([]);
              }
            }
          } else {
            // Verificar se é o erro específico de professores relacionados
            if (
              result.error &&
              result.error.includes("professores relacionados")
            ) {
              showErrorToast(
                "❌ Materia não pode ser deletada pois existe professores relacionados",
              );
            } else {
              showErrorToast(result.error || "Erro ao deletar matéria");
            }
          }
        } catch (error) {
          // Verificar se é o erro específico de professores relacionados
          if (
            error.message &&
            error.message.includes("professores relacionados")
          ) {
            showErrorToast(
              "❌ Materia não pode ser deletada pois existe professores relacionados",
            );
          } else {
            showErrorToast("Erro ao deletar matéria. Tente novamente.");
          }
        }
      },
      () => {
        // Cancelar - não fazer nada
      },
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
        // Professor não pode editar ou deletar matérias, apenas visualizar
        if (user?.role === "professor") {
          return null;
        }
        return (
          <ActionButtons
            onEdit={() => navigate(`/materias/${row._id}/editar`)}
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
        title="Materias"
        buttonText={user?.role === "admin" ? "Adicionar Materia" : undefined}
        onButtonClick={
          user?.role === "admin" ? () => navigate("/materias/novo") : undefined
        }
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
          <MateriaFilters onFilterChange={setFilters} />
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
            <p className="text-gray-600">Carregando matérias...</p>
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
                        onClick={
                          user?.role === "admin"
                            ? () => navigate(`/materias/${row._id}`)
                            : undefined
                        }
                        className={`border-b border-orange-300 transition-colors ${
                          user?.role === "admin"
                            ? "hover:bg-gray-50 cursor-pointer"
                            : ""
                        }`}
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
