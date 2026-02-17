import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
const educacaoLogo = "/educacao.png";
import { useAuth } from "../../context/AuthContext";
import { showErrorToast, showWarningToast, showSuccessToast } from "../../components/feedback/toastConfig";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar se os campos estão preenchidos
    const emailTrimmed = email.trim();
    const passwordTrimmed = password.trim();
    
    if (!emailTrimmed || !passwordTrimmed) {
      // Mostrar toast de warning se algum campo estiver vazio
      showWarningToast();
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(emailTrimmed, passwordTrimmed);
      
      if (result.success) {
        // Mostrar toast de sucesso
        showSuccessToast();
        // Aguardar um pouco antes de redirecionar para o usuário ver o toast
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      } else {
        // Mostrar toast de erro com mensagem específica
        showErrorToast(result.error || "Erro ao fazer login");
      }
    } catch (error) {
      showErrorToast(error.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center justify-center px-4 py-8">
      {/* Logo e Nome da Plataforma */}
      <div className="mb-8 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-2">
          <img
            src={educacaoLogo}
            alt="Logo PlataformaEDC"
            className="w-12 h-12 sm:w-16 sm:h-16 object-contain"
          />
          <div className="flex flex-col">
            <span className="text-xl sm:text-2xl font-bold text-gray-dark leading-tight">
              PlataformaEDC
            </span>
          </div>
        </div>
      </div>

      {/* Formulário de Login */}
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="bg-gradient-to-b from-orange-600 to-orange-500 rounded-lg shadow-lg p-6 sm:p-8 mb-6"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white text-center mb-6">
            Login
          </h2>

          {/* Campo Email */}
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <FiMail className="text-white text-2xl shrink-0" />
              <input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg bg-white text-gray-dark placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <FiLock className="text-white text-2xl shrink-0" />
              <div className="relative flex-1">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-lg bg-white text-gray-dark placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-500 hover:text-orange-600 transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <FiEyeOff className="text-xl" />
                  ) : (
                    <FiEye className="text-xl" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Botão Entrar */}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg shadow-lg py-4 px-6 text-white font-bold text-lg hover:from-orange-700 hover:to-orange-600 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
}
