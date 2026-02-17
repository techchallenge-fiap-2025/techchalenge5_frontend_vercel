import api from "./api";

class ProfessorService {
  /**
   * Busca todos os professores (apenas para admin)
   * @param {Object} filters - Filtros opcionais (ordem, turmaId, materiaId, status)
   * @returns {Promise<Object>} - Lista de professores
   */
  async getAll(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.ordem) {
        params.append("ordem", filters.ordem);
      }
      if (filters.turmaId) {
        params.append("turmaId", filters.turmaId);
      }
      if (filters.materiaId) {
        params.append("materiaId", filters.materiaId);
      }
      if (filters.status) {
        params.append("status", filters.status);
      }
      const queryString = params.toString();
      const url = `/list/teachers${queryString ? `?${queryString}` : ""}`;
      const response = await api.get(url);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar professores",
        data: [],
      };
    }
  }

  /**
   * Cria um novo professor
   * @param {Object} professorData - Dados do professor
   * @returns {Promise<Object>} - Resultado da operação
   */
  async create(professorData) {
    try {
      const response = await api.post("/professor", professorData);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao criar professor",
      };
    }
  }

  /**
   * Busca o perfil do professor logado
   * @returns {Promise<Object>} - Dados do professor
   */
  async getMe() {
    try {
      const response = await api.get("/professor/me");
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar perfil do professor",
      };
    }
  }

  /**
   * Busca um professor por ID
   * @param {string} professorId - ID do professor (Teacher._id)
   * @returns {Promise<Object>} - Dados do professor
   */
  async getById(professorId) {
    try {
      const response = await api.get(`/professor/${professorId}`);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar professor",
      };
    }
  }

  /**
   * Atualiza um professor
   * @param {string} professorId - ID do professor (Teacher._id)
   * @param {Object} professorData - Dados do professor para atualizar
   * @returns {Promise<Object>} - Resultado da operação
   */
  async update(professorId, professorData) {
    try {
      const response = await api.put(`/professor/${professorId}`, professorData);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao atualizar professor",
      };
    }
  }

  /**
   * Alterna o status ativo/inativo do usuário
   * @param {string} professorId - ID do professor (Teacher._id)
   * @returns {Promise<Object>} - Resultado da operação
   */
  async toggleActive(professorId) {
    try {
      const response = await api.put(`/professor/${professorId}/toggle-active`);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao atualizar status do usuário",
      };
    }
  }

  /**
   * Deleta um professor
   * @param {string} professorId - ID do professor (Teacher._id)
   * @returns {Promise<Object>} - Resultado da operação
   */
  async delete(professorId) {
    try {
      const response = await api.delete(`/professor/${professorId}`);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao deletar professor",
      };
    }
  }
}

export default new ProfessorService();
