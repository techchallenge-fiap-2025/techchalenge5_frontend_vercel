import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { PageHeader } from "../../components/ui/PageHeader";
import { UserAvatar } from "../../components/ui/UserAvatar";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { ActionButtons } from "../../components/ui/ActionButtons";
import { DateCell } from "../../components/ui/DateCell";
import { Pagination } from "../../components/ui/Pagination";
import { ProfessorFilters } from "../../components/ui/ProfessorFilters";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import { useAuth } from "../../context/AuthContext";
import professorService from "../../services/professor.service";
import {
  showConfirmDeleteToast,
  showSuccessToast,
  showInfoToast,
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
const transformProfessorData = (professor) => {
  // Usar os últimos 6 caracteres do _id do Teacher como ID curto
  const shortId = professor._id
    ? `#${professor._id.toString().slice(-6)}`
    : "#N/A";

  // Pegar a primeira turma ou mostrar "-" se não tiver
  const primeiraTurma =
    professor.turmas && professor.turmas.length > 0
      ? professor.turmas[0]?.nome || "-"
      : "-";

  return {
    id: shortId,
    _id: professor._id,
    professor: {
      fotoPerfil: professor.userId?.fotoPerfil,
      nome: professor.userId?.name || "Sem nome",
      email: professor.userId?.email || "-",
    },
    turma: primeiraTurma,
    status: professor.status || "ativo",
    criado: formatDate(professor.createdAt),
    modificado: formatDate(professor.updatedAt),
  };
};

const columns = [
  { key: "id", label: "Professor ID" },
  { key: "professor", label: "Professor" },
  { key: "status", label: "Status" },
  { key: "criado", label: "Criado", hiddenMobile: true },
  { key: "modificado", label: "Modificado", hiddenMobile: true },
  { key: "acoes", label: "Ações" },
];

export function ProfessoresPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [professores, setProfessores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ ordem: null, turmaId: null, materiaId: null, status: null });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchProfessores = async () => {
    if (user?.role === "admin") {
      setIsLoading(true);
      const startTime = Date.now();
      
      const result = await professorService.getAll(filters);
      
      // Garantir que o loading seja exibido por pelo menos 1,5 segundos
      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 1500; // 1,5 segundos
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      await new Promise((resolve) => setTimeout(resolve, remainingTime));
      
      if (result.success) {
        const transformedData = result.data.map(transformProfessorData);
        setProfessores(transformedData);
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filters]);

  // Filtrar professores baseado no termo de busca
  const filteredProfessores = useMemo(() => {
    return professores.filter((professor) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        professor.professor.nome.toLowerCase().includes(searchLower) ||
        professor.professor.email.toLowerCase().includes(searchLower) ||
        professor.id.toLowerCase().includes(searchLower)
      );
    });
  }, [professores, searchTerm]);

  // Calcular paginação
  const totalPages = Math.ceil(filteredProfessores.length / itemsPerPage);
  const validPage = useMemo(() => {
    if (totalPages === 0) return 1;
    return Math.min(currentPage, totalPages);
  }, [currentPage, totalPages]);

  const startIndex = (validPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredProfessores.slice(startIndex, endIndex);

  // Resetar página quando o termo de busca mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Função para deletar professor
  const handleDeleteProfessor = (professor) => {
    showConfirmDeleteToast(
      `🗑️ Quer deletar o professor: ${professor.professor.nome}?`,
      async () => {
        try {
          const result = await professorService.delete(professor._id);
          if (result.success) {
            showSuccessToast("✅ Professor deletado com sucesso");
            // Recarregar lista de professores
            await fetchProfessores();
          } else {
            showInfoToast(`ℹ️ Erro ao deletar professor: ${result.error}`);
          }
        } catch (error) {
          showInfoToast("ℹ️ Erro ao deletar professor. Tente novamente.");
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

      case "professor":
        return (
          <UserAvatar
            fotoPerfil={row.professor.fotoPerfil}
            nome={row.professor.nome}
            email={row.professor.email}
          />
        );

      case "status":
        return <StatusBadge status={row.status} />;

      case "criado":
        return <DateCell data={row.criado.data} hora={row.criado.hora} />;

      case "modificado":
        return (
          <DateCell data={row.modificado.data} hora={row.modificado.hora} />
        );

      case "acoes":
        return (
          <ActionButtons
            onEdit={() => navigate(`/professores/${row._id}/editar`)}
            onDelete={() => handleDeleteProfessor(row)}
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
        title="Professores"
        buttonText="Adicionar Professor"
        onButtonClick={() => navigate("/professores/novo")}
      />
      <div className="flex items-center justify-end gap-4">
        <div className="w-[20%]">
          <div className="relative w-full bg-white rounded-lg">
            <input
              type="text"
              placeholder="Buscar ..."
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-dark text-sm sm:text-base"
            />
            <FiSearch
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-orange-500 transition-colors cursor-pointer"
              size={18}
            />
          </div>
        </div>
        <ProfessorFilters onFilterChange={setFilters} />
      </div>
      <section>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Carregando professores...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-orange-500 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
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
                        onClick={() => navigate(`/professores/${row._id}`)}
                        className="border-b border-orange-300 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        {columns.map((column, colIndex) => (
                          <td
                            key={colIndex}
                            className={`px-2 sm:px-4 py-2 sm:py-3 text-gray-dark text-xs sm:text-sm ${
                              column.hiddenMobile ? "hidden lg:table-cell" : ""
                            }`}
                            onClick={(e) => {
                              // Prevenir navegação ao clicar nos botões de ação
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
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
