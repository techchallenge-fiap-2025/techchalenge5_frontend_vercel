import api from "./api";

class AtividadeService {
  /**
   * Busca todas as atividades
   * @returns {Promise<Object>} - Lista de atividades
   */
  async getAll() {
    try {
      const response = await api.get("/atividade");
      return {
        success: true,
        data: response.data || response, // Compatibilidade com diferentes formatos de resposta
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar atividades",
        data: [],
      };
    }
  }

  /**
   * Busca uma atividade específica por ID
   * @param {string} id - ID da atividade
   * @returns {Promise<Object>} - Dados da atividade
   */
  async getById(id) {
    try {
      const response = await api.get(`/atividade/${id}`);
      // A API retorna o objeto diretamente, não dentro de response.data
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar atividade",
      };
    }
  }

  /**
   * Cria uma nova atividade
   * @param {Object} atividadeData - Dados da atividade
   * @returns {Promise<Object>} - Resultado da operação
   */
  async create(atividadeData) {
    try {
      const response = await api.post("/atividade", atividadeData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Erro ao criar atividade",
      };
    }
  }

  /**
   * Deleta uma atividade
   * @param {string} atividadeId - ID da atividade
   * @returns {Promise<Object>} - Resultado da operação
   */
  async delete(atividadeId) {
    try {
      const response = await api.delete(`/atividade/${atividadeId}`);
      // DELETE retorna 204 (No Content), então response pode ser null
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || "Erro ao deletar atividade",
      };
    }
  }
}

export default new AtividadeService();
