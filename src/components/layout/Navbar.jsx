import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  FiHome,
  FiUsers,
  FiUser,
  FiUserCheck,
  FiBook,
  FiBookOpen,
  FiCalendar,
  FiClipboard,
  FiX,
  FiLogOut,
  FiAward,
} from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { Avatar } from "../ui/Avatar";

const getNavItems = (userRole) => {
  const baseItems = [
    { path: "/dashboard", label: "Dashboard", icon: FiHome },
    { path: "/alunos", label: "Alunos", icon: FiUsers },
    { path: "/professores", label: "Professores", icon: FiUser },
    { path: "/responsaveis", label: "Responsaveis", icon: FiUserCheck },
    { path: "/turmas", label: "Turmas", icon: FiBook },
    { path: "/materias", label: "Materias", icon: FiBookOpen },
    { path: "/aulas", label: "Aulas", icon: FiCalendar },
  ];

  // Se for aluno, filtrar itens e mudar "Dashboard" para "Cursos", adicionar Boletim e Meu Aprendizado
  if (userRole === "aluno") {
    const excludedPaths = [
      "/alunos",
      "/professores",
      "/turmas",
      "/materias",
      "/responsaveis",
    ];
    const alunoItems = baseItems
      .filter((item) => !excludedPaths.includes(item.path))
      .map((item) =>
        item.path === "/dashboard" ? { ...item, label: "Cursos" } : item,
      );

    // Adicionar Boletim e Meu Aprendizado para alunos
    alunoItems.push({ path: "/boletim", label: "Boletim", icon: FiClipboard });
    alunoItems.push({
      path: "/meu-aprendizado",
      label: "Meu Aprendizado",
      icon: FiAward,
    });

    return alunoItems;
  }

  // Se for professor, mostrar apenas Dashboard, Materias, Turmas e Calendario
  if (userRole === "professor") {
    const professorItems = [
      { path: "/dashboard", label: "Dashboard", icon: FiHome },
      { path: "/materias", label: "Materias", icon: FiBookOpen },
      { path: "/turmas", label: "Turmas", icon: FiBook },
      { path: "/aulas", label: "Calendario", icon: FiCalendar },
    ];

    return professorItems;
  }

  return baseItems;
};

export function Navbar({ isMobileMenuOpen, onCloseMobileMenu }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const navItems = getNavItems(user?.role);

  const handleLogout = () => {
    onCloseMobileMenu(); // Fechar o menu mobile antes de fazer logout
    logout();
  };

  const handleProfileClick = () => {
    if (user?.role === "aluno" || user?.role === "professor") {
      onCloseMobileMenu(); // Fechar o menu mobile antes de navegar
      navigate("/perfil");
    }
  };

  // Fechar menu mobile ao mudar de rota
  useEffect(() => {
    if (isMobileMenuOpen) {
      onCloseMobileMenu();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Prevenir scroll do body quando menu mobile estiver aberto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const isActive = (path) => {
    return (
      location.pathname === path ||
      (path === "/dashboard" && location.pathname === "/")
    );
  };

  return (
    <>
      {/* Navbar Desktop */}
      <nav className="hidden lg:block bg-orange-500">
        <div className="px-4 xl:px-6">
          <ul className="flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center gap-2 px-3 xl:px-4 py-3 text-white font-medium
                      transition-colors relative whitespace-nowrap
                      hover:bg-orange-600
                      ${active ? "bg-orange-700" : ""}
                    `}
                  >
                    <Icon size={18} />
                    <span className="text-sm xl:text-base">{item.label}</span>
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-1 bg-white" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Mobile/Tablet Menu Overlay - Com blur transparente */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-white/5 z-40 lg:hidden transition-opacity duration-300"
          onClick={onCloseMobileMenu}
        />
      )}

      {/* Mobile/Tablet Sidebar */}
      <nav
        className={`
          fixed top-0 left-0 h-full w-64 bg-white/95 backdrop-blur-md shadow-xl z-50 transform transition-transform duration-300 ease-in-out
          lg:hidden
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header do Mobile Menu */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-orange-500">
            <span className="text-white font-bold text-lg">Menu</span>
            <button
              onClick={onCloseMobileMenu}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="Fechar menu"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Nav Items Mobile */}
          <ul className="flex-1 overflow-y-auto py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onCloseMobileMenu}
                    className={`
                      flex items-center gap-3 px-4 py-3 text-gray-dark font-medium
                      transition-colors
                      hover:bg-gray-100
                      ${
                        active
                          ? "bg-orange-50 text-orange-500 border-r-4 border-orange-500"
                          : ""
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Footer do Mobile Menu */}
          <div className="border-t border-gray-200 p-4">
            {(user?.role === "aluno" || user?.role === "professor") ? (
              <div 
                onClick={handleProfileClick}
                className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
              >
                <Avatar
                  fotoPerfil={user?.fotoPerfil}
                  name={user?.name || "Usuário"}
                  size="lg"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-dark">
                    {user?.name || "Usuário"}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {user?.role || "Usuário"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                <Avatar
                  fotoPerfil={user?.fotoPerfil}
                  name={user?.name || "Usuário"}
                  size="lg"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-dark">
                    {user?.name || "Usuário"}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {user?.role || "Usuário"}
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-2 text-gray-600 hover:text-red-500 transition-colors"
              aria-label="Sair"
            >
              <FiLogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
