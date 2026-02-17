import api from "./api";

class MateriaService {
  /**
   * Busca todas as matérias (apenas para admin)
   * @param {Object} filters - Filtros opcionais (ordem, status)
   * @returns {Promise<Object>} - Lista de matérias
   */
  async getAll(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.ordem) {
        params.append("ordem", filters.ordem);
      }
      if (filters.status) {
        params.append("status", filters.status);
      }
      const queryString = params.toString();
      const url = `/materia${queryString ? `?${queryString}` : ""}`;
      const response = await api.get(url);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar matérias",
        data: [],
      };
    }
  }

  /**
   * Cria uma nova matéria
   * @param {Object} materiaData - Dados da matéria
   * @returns {Promise<Object>} - Resultado da operação
   */
  async create(materiaData) {
    try {
      const response = await api.post("/materia", materiaData);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao criar matéria",
      };
    }
  }

  /**
   * Busca uma matéria por ID
   * @param {string} materiaId - ID da matéria
   * @returns {Promise<Object>} - Dados da matéria
   */
  async getById(materiaId) {
    try {
      const response = await api.get(`/materia/${materiaId}`);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar matéria",
      };
    }
  }

  /**
   * Atualiza uma matéria
   * @param {string} materiaId - ID da matéria
   * @param {Object} materiaData - Dados da matéria para atualizar
   * @returns {Promise<Object>} - Resultado da operação
   */
  async update(materiaId, materiaData) {
    try {
      const response = await api.put(`/materia/${materiaId}`, materiaData);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao atualizar matéria",
      };
    }
  }

  /**
   * Deleta uma matéria
   * @param {string} materiaId - ID da matéria
   * @returns {Promise<Object>} - Resultado da operação
   */
  async delete(materiaId) {
    try {
      const response = await api.delete(`/materia/${materiaId}`);
      // DELETE retorna 204 (No Content), então response pode ser null
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      // Extrair a mensagem de erro do backend
      const errorMessage = error.message || "Erro ao deletar matéria";
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Busca as matérias do professor logado (apenas para professor)
   * @returns {Promise<Object>} - Lista de matérias do professor
   */
  async getMinhasMaterias() {
    try {
      const response = await api.get("/materia/minhas-materias");
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar matérias",
        data: [],
      };
    }
  }
}

export default new MateriaService();
