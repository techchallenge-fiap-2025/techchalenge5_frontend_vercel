export function StatsCards({ title, value, icon }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-center gap-10">
      <div className="text-orange-500 text-5xl shrink-0">{icon}</div>
      <div className="flex flex-col items-center min-w-0">
        <h2 className="text-4xl font-bold text-gray-dark leading-tight">
          {value}
        </h2>
        <p className="text-gray-dark font-semibold text-lg mt-1">{title}</p>
      </div>
    </div>
  );
}
