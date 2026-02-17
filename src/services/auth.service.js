import api from "./api";

class AuthService {
  /**
   * Faz login do usuário
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<Object>} - Dados do usuário e token
   */
  async login(email, password) {
    try {
      const response = await api.post("/auth/login", { email, password });
      
      // Salvar token no localStorage
      if (response.token) {
        api.setToken(response.token);
      }

      return {
        success: true,
        user: response.user,
        token: response.token,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao fazer login",
      };
    }
  }

  /**
   * Faz logout do usuário
   */
  logout() {
    api.removeToken();
  }

  /**
   * Verifica se o usuário está autenticado
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!api.getToken();
  }

  /**
   * Obtém o token atual
   * @returns {string|null}
   */
  getToken() {
    return api.getToken();
  }
}

export default new AuthService();
