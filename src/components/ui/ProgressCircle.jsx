import { FiAward } from "react-icons/fi";

export function ProgressCircle({ progresso, isCompleto = false, size = 80 }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progresso / 100) * circumference;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Círculo de fundo (laranja claro) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isCompleto ? "#10b981" : "#fed7aa"}
          strokeWidth="8"
          fill="none"
        />
        {/* Círculo de progresso (laranja escuro ou verde) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isCompleto ? "#059669" : "#ea580c"}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={isCompleto ? 0 : offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      {/* Conteúdo no centro */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isCompleto ? (
          <FiAward className="text-green-600" size={size * 0.4} />
        ) : (
          <span className="text-sm sm:text-base font-bold text-orange-600">
            {progresso}%
          </span>
        )}
      </div>
    </div>
  );
}
