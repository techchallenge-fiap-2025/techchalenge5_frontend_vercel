import { useState, useEffect, useRef } from "react";
import { FiFilter, FiX, FiChevronDown } from "react-icons/fi";
import { useIsMobile } from "../../hooks/useIsMobile";

const orderOptions = [
  { value: "a-z", label: "A-Z (Ordem Alfabética)" },
  { value: "z-a", label: "Z-A (Ordem Alfabética Reversa)" },
  { value: "recente", label: "Recém Adicionado" },
  { value: "antigo", label: "Mais Antigo" },
];

export function ResponsavelFilters({ onFilterChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const filterRef = useRef(null);
  const [isRotating, setIsRotating] = useState(false);
  const isMobile = useIsMobile();

  // Fechar ao clicar fora (apenas em desktop)
  useEffect(() => {
    if (!isMobile) {
      const handleClickOutside = (event) => {
        if (filterRef.current && !filterRef.current.contains(event.target)) {
          setIsRotating(true);
          setTimeout(() => {
            setIsOpen(false);
            setIsRotating(false);
          }, 150);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen, isMobile]);

  // Prevenir scroll do body quando drawer estiver aberto em mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, isOpen]);

  const handleOrderChange = (selectedOption) => {
    setSelectedOrder(selectedOption);
    // Não aplicar filtros automaticamente, apenas atualizar estado local
  };

  const handleApplyFilters = () => {
    const filters = {
      ordem: selectedOrder?.value || null,
    };
    onFilterChange(filters);
    setIsRotating(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsRotating(false);
    }, 150);
  };

  const handleClearFilters = () => {
    setSelectedOrder(null);
    onFilterChange({ ordem: null });
    setIsRotating(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsRotating(false);
    }, 150);
  };

  return (
    <div className="relative" ref={filterRef}>
      {/* Botão de filtro */}
      <button
        onClick={() => {
          setIsRotating(true);
          setTimeout(() => {
            setIsOpen(!isOpen);
            setIsRotating(false);
          }, 150);
        }}
        className={`p-2 border bg-white border-orange-500 rounded-lg transition-all duration-300 ${
          isOpen
            ? "bg-orange-50 text-orange-600"
            : "hover:bg-orange-50 hover:text-orange-500"
        }`}
      >
        <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
          {/* Ícone de Filtro - aparece quando fechado, desaparece quando aberto */}
          <FiFilter
            className={`absolute transition-all duration-300 ease-in-out ${
              isOpen
                ? "opacity-0 rotate-180 scale-0"
                : isRotating
                ? "opacity-0 rotate-90 scale-50"
                : "opacity-100 rotate-0 scale-100"
            }`}
            size={20}
          />
          {/* Ícone de X - aparece quando aberto, desaparece quando fechado */}
          <FiX
            className={`absolute transition-all duration-300 ease-in-out ${
              isOpen && !isRotating
                ? "opacity-100 rotate-0 scale-100"
                : isRotating && isOpen
                ? "opacity-0 rotate-90 scale-50"
                : "opacity-0 -rotate-180 scale-0"
            }`}
            size={20}
          />
        </div>
      </button>

      {/* Overlay para mobile/tablet */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-white/5 z-40 transition-opacity duration-300"
          onClick={() => {
            setIsRotating(true);
            setTimeout(() => {
              setIsOpen(false);
              setIsRotating(false);
            }, 150);
          }}
        />
      )}

      {/* Dropdown de filtros (Desktop) ou Drawer (Mobile/Tablet) */}
      {isOpen && (
        <div
          className={`${
            isMobile
              ? "fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out"
              : "absolute right-0 mt-2 w-80 bg-white border-2 border-orange-500 rounded-lg shadow-lg z-50 filter-dropdown-open"
          }`}
          ref={filterRef}
        >
          <div className={`${isMobile ? "h-full flex flex-col overflow-y-auto" : ""} p-4 space-y-4`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
              <button
                onClick={() => {
                  setIsRotating(true);
                  setTimeout(() => {
                    setIsOpen(false);
                    setIsRotating(false);
                  }, 150);
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                type="button"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Filtro de Ordem */}
            <CustomSelect
              label="Ordenar por"
              options={orderOptions}
              value={selectedOrder}
              onChange={handleOrderChange}
              placeholder="Selecione uma ordem..."
            />

            {/* Botões de ação */}
            <div className={`flex gap-2 pt-2 ${isMobile ? "mt-auto" : ""}`}>
              <button
                onClick={handleApplyFilters}
                className="flex-1 py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Aplicar
              </button>
              {selectedOrder && (
                <button
                  onClick={handleClearFilters}
                  className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente Select customizado
function CustomSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
  isLoading = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative" ref={selectRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-2 text-left bg-white border rounded-lg transition-all duration-200 flex items-center justify-between ${
            isOpen
              ? "border-orange-500 ring-2 ring-orange-200"
              : "border-gray-300 hover:border-orange-500 hover:bg-orange-50"
          }`}
        >
          <span
            className={`${
              value ? "text-gray-800" : "text-gray-500"
            } truncate`}
          >
            {isLoading
              ? "Carregando..."
              : value
              ? value.label
              : placeholder}
          </span>
          <div className="flex items-center gap-2">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={16} />
              </button>
            )}
            <FiChevronDown
              className={`transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              } text-gray-500`}
              size={18}
            />
          </div>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border-2 border-orange-500 rounded-lg shadow-lg max-h-60 overflow-auto">
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                Carregando...
              </div>
            ) : options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                Nenhuma opção disponível
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                    value?.value === option.value
                      ? "bg-orange-500 text-white"
                      : "text-gray-800 hover:bg-orange-50"
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
