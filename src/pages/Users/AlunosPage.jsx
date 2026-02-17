import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import { PageHeader } from "../../components/ui/PageHeader";
import { UserAvatar } from "../../components/ui/UserAvatar";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { ActionButtons } from "../../components/ui/ActionButtons";
import { DateCell } from "../../components/ui/DateCell";
import { Pagination } from "../../components/ui/Pagination";
import { StudentFilters } from "../../components/ui/StudentFilters";
import { LoadingScreen } from "../../components/ui/LoadingScreen";
import { useAuth } from "../../context/AuthContext";
import alunoService from "../../services/aluno.service";
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
const transformAlunoData = (aluno) => {
  // Usar os últimos 6 caracteres do _id do Student como ID curto
  const shortId = aluno._id ? `#${aluno._id.toString().slice(-6)}` : "#N/A";

  // Formatar nome da turma com ano letivo se disponível
  let turmaNome = "-";
  if (aluno.turmaId) {
    if (typeof aluno.turmaId === "object" && aluno.turmaId.nome) {
      turmaNome = aluno.turmaId.anoLetivo
        ? `${aluno.turmaId.nome} (${aluno.turmaId.anoLetivo})`
        : aluno.turmaId.nome;
    } else if (typeof aluno.turmaId === "string") {
      turmaNome = aluno.turmaId;
    }
  }

  return {
    id: shortId,
    _id: aluno._id,
    aluno: {
      fotoPerfil: aluno.userId?.fotoPerfil,
      nome: aluno.userId?.name || "Sem nome",
      email: aluno.userId?.email || "-",
    },
    turma: turmaNome,
    status: aluno.status || "ativo",
    criado: formatDate(aluno.createdAt),
    modificado: formatDate(aluno.updatedAt),
  };
};

const columns = [
  { key: "id", label: "Aluno ID" },
  { key: "aluno", label: "Aluno" },
  { key: "turma", label: "Turma" },
  { key: "status", label: "Status" },
  { key: "criado", label: "Criado", hiddenMobile: true },
  { key: "modificado", label: "Modificado", hiddenMobile: true },
  { key: "acoes", label: "Ações" },
];

export function AlunosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alunos, setAlunos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ ordem: null, turmaId: null, status: null });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAlunos = async () => {
    if (user?.role === "admin") {
      setIsLoading(true);
      const startTime = Date.now();
      
      const result = await alunoService.getAll(filters);
      
      // Garantir que o loading seja exibido por pelo menos 1,5 segundos
      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 1500; // 1,5 segundos
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
      
      await new Promise((resolve) => setTimeout(resolve, remainingTime));
      
      if (result.success) {
        const transformedData = result.data.map(transformAlunoData);
        setAlunos(transformedData);
      }
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlunos();
  }, [user, filters]);

  // Função para deletar aluno
  const handleDeleteAluno = (aluno) => {
    showConfirmDeleteToast(
      `🗑️ Quer deletar o aluno: ${aluno.aluno.nome}?`,
      async () => {
        try {
          const result = await alunoService.delete(aluno._id);
          if (result.success) {
            showSuccessToast("✅ Aluno deletado com sucesso");
            // Recarregar lista de alunos
            await fetchAlunos();
          } else {
            showInfoToast(`ℹ️ Erro ao deletar aluno: ${result.error}`);
          }
        } catch (error) {
          showInfoToast("ℹ️ Erro ao deletar aluno. Tente novamente.");
        }
      },
      () => {
        // Cancelar - não fazer nada
      },
    );
  };

  // Filtrar alunos baseado no termo de busca
  const filteredAlunos = useMemo(() => {
    return alunos.filter((aluno) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        aluno.aluno.nome.toLowerCase().includes(searchLower) ||
        aluno.aluno.email.toLowerCase().includes(searchLower) ||
        aluno.turma.toLowerCase().includes(searchLower) ||
        aluno.id.toLowerCase().includes(searchLower)
      );
    });
  }, [alunos, searchTerm]);

  // Calcular paginação
  const totalPages = Math.ceil(filteredAlunos.length / itemsPerPage);
  const validPage = useMemo(() => {
    if (totalPages === 0) return 1;
    return Math.min(currentPage, totalPages);
  }, [currentPage, totalPages]);

  const startIndex = (validPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredAlunos.slice(startIndex, endIndex);

  // Resetar página quando o termo de busca mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const renderCell = (key, row) => {
    switch (key) {
      case "id":
        return <span className="font-medium">{row.id}</span>;

      case "aluno":
        return (
          <UserAvatar
            fotoPerfil={row.aluno.fotoPerfil}
            nome={row.aluno.nome}
            email={row.aluno.email}
          />
        );

      case "turma":
        return <span>{row.turma}</span>;

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
            onEdit={() => navigate(`/alunos/${row._id}/editar`)}
            onDelete={() => handleDeleteAluno(row)}
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
        title="Alunos"
        buttonText="Adicionar Aluno"
        onButtonClick={() => navigate("/alunos/novo")}
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
        <StudentFilters onFilterChange={setFilters} />
      </div>
      <section>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Carregando alunos...</p>
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
                        onClick={() => navigate(`/alunos/${row._id}`)}
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
