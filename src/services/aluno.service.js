import api from "./api";

class AlunoService {
  /**
   * Busca todos os alunos (apenas para admin)
   * @param {Object} filters - Filtros opcionais (ordem, turmaId, status)
   * @returns {Promise<Object>} - Lista de alunos
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
      if (filters.status) {
        params.append("status", filters.status);
      }
      const queryString = params.toString();
      const url = `/list/students${queryString ? `?${queryString}` : ""}`;
      const response = await api.get(url);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar alunos",
        data: [],
      };
    }
  }

  /**
   * Cria um novo aluno
   * @param {Object} alunoData - Dados do aluno
   * @returns {Promise<Object>} - Resultado da operação
   */
  async create(alunoData) {
    try {
      const response = await api.post("/aluno", alunoData);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao criar aluno",
      };
    }
  }

  /**
   * Busca o perfil do aluno logado
   * @returns {Promise<Object>} - Dados do aluno
   */
  async getMe() {
    try {
      const response = await api.get("/aluno/me");
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar perfil do aluno",
      };
    }
  }

  /**
   * Busca um aluno por ID
   * @param {string} alunoId - ID do aluno (Student._id)
   * @returns {Promise<Object>} - Dados do aluno
   */
  async getById(alunoId) {
    try {
      const response = await api.get(`/aluno/${alunoId}`);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar aluno",
      };
    }
  }

  /**
   * Alterna o status ativo/inativo do usuário
   * @param {string} alunoId - ID do aluno (Student._id)
   * @returns {Promise<Object>} - Resultado da operação
   */
  async toggleActive(alunoId) {
    try {
      const response = await api.put(`/aluno/${alunoId}/toggle-active`);
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
   * Atualiza um aluno
   * @param {string} alunoId - ID do aluno (Student._id)
   * @param {Object} alunoData - Dados do aluno para atualizar
   * @returns {Promise<Object>} - Resultado da operação
   */
  async update(alunoId, alunoData) {
    try {
      const response = await api.put(`/aluno/${alunoId}`, alunoData);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao atualizar aluno",
      };
    }
  }

  /**
   * Deleta um aluno
   * @param {string} alunoId - ID do aluno (Student._id)
   * @returns {Promise<Object>} - Resultado da operação
   */
  async delete(alunoId) {
    try {
      const response = await api.delete(`/aluno/${alunoId}`);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao deletar aluno",
      };
    }
  }

  /**
   * Busca as turmas históricas do aluno logado
   * @returns {Promise<Object>} - Lista de turmas
   */
  async getMinhasTurmas() {
    try {
      const response = await api.get("/aluno/turmas/minhas");
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
   * Busca o boletim do aluno logado
   * @param {Object} options - Opções de busca (anoLetivo, turmaId)
   * @returns {Promise<Object>} - Dados do boletim
   */
  async getMeuBoletim(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.anoLetivo) {
        params.append("anoLetivo", options.anoLetivo);
      }
      if (options.turmaId) {
        params.append("turmaId", options.turmaId);
      }
      const queryString = params.toString();
      const url = `/aluno/boletim/meu${queryString ? `?${queryString}` : ""}`;
      const response = await api.get(url);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar boletim",
      };
    }
  }

  /**
   * Busca as turmas de um aluno específico (para admin/professor)
   * @param {string} alunoId - ID do aluno
   * @returns {Promise<Object>} - Lista de turmas
   */
  async getTurmasAluno(alunoId) {
    try {
      const response = await api.get(`/aluno/${alunoId}/turmas`);
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
   * Busca o boletim de um aluno específico (para admin/professor)
   * @param {string} alunoId - ID do aluno
   * @param {Object} options - Opções de busca (turmaId)
   * @returns {Promise<Object>} - Dados do boletim
   */
  async getBoletimAluno(alunoId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.turmaId) {
        params.append("turmaId", options.turmaId);
      }
      const queryString = params.toString();
      const url = `/aluno/${alunoId}/boletim${queryString ? `?${queryString}` : ""}`;
      const response = await api.get(url);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar boletim",
      };
    }
  }
}

export default new AlunoService();
