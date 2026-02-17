import { BrowserRouter, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Header } from "./components/layout/Header";
import { Navbar } from "./components/layout/Navbar";
import { AppRoutes } from "./routes/AppRoutes";
import { LoadingScreen } from "./components/ui/LoadingScreen";
import { AuthProvider } from "./context/AuthContext";
import { ToastContainer } from "./components/feedback/ToastContainer";

function AppContent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const location = useLocation();

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleCloseMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Interceptar mudanças de rota e mostrar loading
  useEffect(() => {
    // Não mostrar loading na primeira renderização
    if (isFirstLoad) {
      setIsFirstLoad(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500); // 2 segundos

    return () => clearTimeout(timer);
  }, [location.pathname, isFirstLoad]);

  const isLoginPage = location.pathname === "/login";

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col">
      <ToastContainer />
      {isLoading && <LoadingScreen />}
      {!isLoginPage && (
        <>
          <Header onMenuToggle={handleMenuToggle} />
          <Navbar
            isMobileMenuOpen={isMobileMenuOpen}
            onCloseMobileMenu={handleCloseMobileMenu}
          />
        </>
      )}
      <main className={isLoginPage ? "flex-1" : "flex-1 p-4 sm:p-6 lg:px-12 xl:px-16 2xl:px-24"}>
        <AppRoutes />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
