// Configuração base da API
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/**
 * Cliente HTTP para fazer requisições à API
 */
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  /**
   * Obtém o token de autenticação do localStorage
   */
  getToken() {
    return localStorage.getItem("token");
  }

  /**
   * Salva o token no localStorage
   */
  setToken(token) {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }

  /**
   * Remove o token do localStorage
   */
  removeToken() {
    localStorage.removeItem("token");
  }

  /**
   * Faz uma requisição HTTP
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      // Se a resposta está vazia (status 204 No Content), retornar null
      if (response.status === 204) {
        if (!response.ok) {
          throw new Error("Erro na requisição");
        }
        return null; // DELETE geralmente retorna 204 sem corpo
      }

      // Verificar se há conteúdo antes de tentar fazer parse JSON
      const contentType = response.headers.get("content-type");
      const hasJsonContent = contentType && contentType.includes("application/json");
      
      let data = null;
      if (hasJsonContent) {
        const text = await response.text();
        // Só fazer parse se houver conteúdo
        if (text && text.trim().length > 0) {
          try {
            data = JSON.parse(text);
          } catch (parseError) {
            // Se não conseguir fazer parse, retornar o texto ou null
            data = text || null;
          }
        }
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Erro na requisição");
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "GET" });
  }

  /**
   * POST request
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: "DELETE" });
  }

  /**
   * POST request para upload de arquivos
   */
  async upload(endpoint, formData, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const config = {
      ...options,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, {
        ...config,
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Erro no upload");
      }

      return data;
    } catch (error) {
      throw error;
    }
  }
}

export default new ApiClient(API_BASE_URL);
