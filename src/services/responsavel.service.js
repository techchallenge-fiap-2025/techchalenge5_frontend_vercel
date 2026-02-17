import api from "./api";

class ResponsavelService {
  /**
   * Busca todos os responsáveis (apenas para admin)
   * @param {Object} filters - Filtros opcionais (ordem)
   * @returns {Promise<Object>} - Lista de responsáveis
   */
  async getAll(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.ordem) {
        params.append("ordem", filters.ordem);
      }
      const queryString = params.toString();
      const url = `/responsavel${queryString ? `?${queryString}` : ""}`;
      const response = await api.get(url);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar responsáveis",
        data: [],
      };
    }
  }

  /**
   * Cria um novo responsável
   * @param {Object} responsavelData - Dados do responsável
   * @returns {Promise<Object>} - Resultado da operação
   */
  async create(responsavelData) {
    try {
      const response = await api.post("/responsavel", responsavelData);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      // Capturar a mensagem de erro do backend
      const errorMessage = error.message || "Erro ao criar responsável";
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Busca um responsável por ID
   * @param {string} responsavelId - ID do responsável
   * @returns {Promise<Object>} - Dados do responsável
   */
  async getById(responsavelId) {
    try {
      const response = await api.get(`/responsavel/${responsavelId}`);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar responsável",
      };
    }
  }

  /**
   * Atualiza um responsável
   * @param {string} responsavelId - ID do responsável
   * @param {Object} responsavelData - Dados do responsável
   * @returns {Promise<Object>} - Resultado da operação
   */
  async update(responsavelId, responsavelData) {
    try {
      const response = await api.put(`/responsavel/${responsavelId}`, responsavelData);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      // Capturar a mensagem de erro do backend
      const errorMessage = error.message || "Erro ao atualizar responsável";
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Alterna o status ativo/inativo do responsável
   * @param {string} responsavelId - ID do responsável
   * @returns {Promise<Object>} - Resultado da operação
   */
  async toggleActive(responsavelId) {
    try {
      const response = await api.put(`/responsavel/${responsavelId}/toggle-active`);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao atualizar status do responsável",
      };
    }
  }

  /**
   * Deleta um responsável
   * @param {string} responsavelId - ID do responsável
   * @returns {Promise<Object>} - Resultado da operação
   */
  async delete(responsavelId) {
    try {
      const response = await api.delete(`/responsavel/${responsavelId}`);
      // DELETE retorna 204 (No Content), então response pode ser null
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao deletar responsável",
      };
    }
  }
}

export default new ResponsavelService();
