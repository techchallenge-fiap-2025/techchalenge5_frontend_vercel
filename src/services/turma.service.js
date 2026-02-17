import api from "./api";

class TurmaService {
  /**
   * Busca todas as turmas (apenas para admin)
   * @param {Object} filters - Filtros opcionais (ordem, status, nivelEducacional, anoLetivo, periodo)
   * @returns {Promise<Object>} - Lista de turmas
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
      if (filters.nivelEducacional) {
        params.append("nivelEducacional", filters.nivelEducacional);
      }
      if (filters.anoLetivo) {
        params.append("anoLetivo", filters.anoLetivo);
      }
      if (filters.periodo) {
        params.append("periodo", filters.periodo);
      }
      const queryString = params.toString();
      const url = `/turma${queryString ? `?${queryString}` : ""}`;
      const response = await api.get(url);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar turmas",
        data: [],
      };
    }
  }

  /**
   * Cria uma nova turma
   * @param {Object} turmaData - Dados da turma
   * @returns {Promise<Object>} - Resultado da operação
   */
  async create(turmaData) {
    try {
      const response = await api.post("/turma", turmaData);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao criar turma",
      };
    }
  }

  /**
   * Busca uma turma por ID
   * @param {string} turmaId - ID da turma
   * @returns {Promise<Object>} - Dados da turma
   */
  async getById(turmaId) {
    try {
      const response = await api.get(`/turma/${turmaId}`);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar turma",
      };
    }
  }

  /**
   * Atualiza uma turma
   * @param {string} turmaId - ID da turma
   * @param {Object} turmaData - Dados da turma para atualizar
   * @returns {Promise<Object>} - Resultado da operação
   */
  async update(turmaId, turmaData) {
    try {
      const response = await api.put(`/turma/${turmaId}`, turmaData);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao atualizar turma",
      };
    }
  }

  /**
   * Deleta uma turma
   * @param {string} turmaId - ID da turma
   * @returns {Promise<Object>} - Resultado da operação
   */
  async delete(turmaId) {
    try {
      const response = await api.delete(`/turma/${turmaId}`);
      // DELETE retorna 204 (No Content), então response pode ser null
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao deletar turma",
      };
    }
  }

  /**
   * Busca as turmas do professor logado (apenas para professor)
   * @returns {Promise<Object>} - Lista de turmas do professor
   */
  async getMinhasTurmas() {
    try {
      const response = await api.get("/turma/minhas-turmas");
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar turmas",
        data: [],
      };
    }
  }
}

export default new TurmaService();
