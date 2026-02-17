export function DateCell({ data, hora }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs sm:text-sm">{data}</span>
      {hora && <span className="text-xs text-gray-500">{hora}</span>}
    </div>
  );
}
