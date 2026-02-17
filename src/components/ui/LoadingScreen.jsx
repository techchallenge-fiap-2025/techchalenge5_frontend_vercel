const educacaoLogo = "/educacao.png";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        {/* Logo com círculo de carregamento */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
          {/* Logo centralizado */}
          <img
            src={educacaoLogo}
            alt="Logo PlataformaEDC"
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain z-10 relative"
          />
          {/* Círculo de carregamento ao redor do logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
