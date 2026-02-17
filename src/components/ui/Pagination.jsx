export function Pagination({ currentPage, totalPages, onPageChange }) {
  const handleFirstPage = () => {
    if (currentPage > 1) {
      onPageChange(1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleLastPage = () => {
    if (currentPage < totalPages) {
      onPageChange(totalPages);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-3 sm:gap-4 px-2 sm:px-4 py-3 sm:py-4 border-t border-gray-200">
      <span className="text-gray-700 font-medium text-sm sm:text-base">
        Página {currentPage} de {totalPages}
      </span>
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={handleFirstPage}
          disabled={currentPage === 1}
          className="p-1.5 sm:p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-xs sm:text-sm"
          aria-label="Primeira página"
        >
          &lt;&lt;
        </button>
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className="p-1.5 sm:p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-xs sm:text-sm"
          aria-label="Página anterior"
        >
          &lt;
        </button>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="p-1.5 sm:p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-xs sm:text-sm"
          aria-label="Próxima página"
        >
          &gt;
        </button>
        <button
          onClick={handleLastPage}
          disabled={currentPage === totalPages}
          className="p-1.5 sm:p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 text-xs sm:text-sm"
          aria-label="Última página"
        >
          &gt;&gt;
        </button>
      </div>
    </div>
  );
}
