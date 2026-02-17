import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { Pagination } from "./Pagination";
import { useState, useMemo } from "react";

export function DataTable({ 
  columns = [], 
  data = [], 
  itemsPerPage = 10,
  renderCell = null 
}) {
  const [currentPage, setCurrentPage] = useState(1);
  
  // Calcular paginação e garantir que a página atual seja válida
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const validPage = useMemo(() => {
    if (totalPages === 0) return 1;
    return Math.min(currentPage, totalPages);
  }, [currentPage, totalPages]);
  
  const startIndex = (validPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="bg-white rounded-lg border border-orange-500  overflow-hidden shadow-sm">
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
                  className="border-b border-orange-300 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-2 sm:px-4 py-2 sm:py-3 text-gray-dark text-xs sm:text-sm ${
                        column.hiddenMobile ? "hidden lg:table-cell" : ""
                      }`}
                    >
                      {renderCell
                        ? renderCell(column.key, row, rowIndex)
                        : row[column.key]}
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
  );
}
