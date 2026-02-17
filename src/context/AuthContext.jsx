import { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/auth.service";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Verificar se há token salvo ao carregar a aplicação
  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      // Tentar restaurar dados do usuário do localStorage
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error("Erro ao restaurar dados do usuário:", error);
          // Se houver erro ao restaurar, limpar tudo
          authService.logout();
          localStorage.removeItem("user");
          setUser(null);
        }
      }
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  // Deslogar automaticamente quando o usuário sair da plataforma
  useEffect(() => {
    const handlePageHide = () => {
      // Limpar dados de autenticação quando a página é descarregada
      // Isso acontece quando o usuário fecha a aba, navega para outro site, etc.
      authService.logout();
      localStorage.removeItem("user");
    };

    const handleBeforeUnload = () => {
      // Fallback para navegadores que não suportam pagehide
      authService.logout();
      localStorage.removeItem("user");
    };

    // Adicionar listeners
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      
      if (result.success) {
        setUser(result.user);
        // Salvar dados do usuário no localStorage
        localStorage.setItem("user", JSON.stringify(result.user));
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return { success: false, error: result.error };
      }
    } catch (error) {
      setIsLoading(false);
      return { success: false, error: error.message || "Erro ao fazer login" };
    }
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const isAuthenticated = authService.isAuthenticated() && !!user;

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
