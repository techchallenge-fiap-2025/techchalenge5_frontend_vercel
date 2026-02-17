import { FiBell, FiChevronDown, FiLogOut, FiMenu, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
const educacaoLogo = "/educacao.png";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "../ui/Avatar";

export function Header({ onMenuToggle }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
  };

  const handleProfileClick = () => {
    if (user?.role === "aluno" || user?.role === "professor") {
      navigate("/perfil");
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 ">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <img
            src={educacaoLogo}
            alt="Logo PlataformaEDC"
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
          />
          <div className="flex flex-col">
            <h1 className="text-base sm:text-xl font-bold text-black">
              PlataformaEDC
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          {(user?.role === "aluno" || user?.role === "professor") && (
            <div 
              onClick={handleProfileClick}
              className="hidden lg:flex items-center gap-3 cursor-pointer group hover:opacity-80 transition-opacity"
            >
              <Avatar
                fotoPerfil={user?.fotoPerfil}
                name={user?.name || "Usuário"}
                size="md"
              />
            </div>
          )}
          <button
            onClick={onMenuToggle}
            className="lg:hidden text-gray-600 hover:text-orange-500 transition-colors cursor-pointer p-2"
            aria-label="Toggle menu"
          >
            <FiMenu size={24} />
          </button>
          <button
            onClick={handleLogout}
            className="hidden lg:block text-gray-600 hover:text-red-500 transition-colors cursor-pointer"
            aria-label="Sair"
          >
            <FiLogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
