import api from "./api";

class NotaAtividadeService {
  /**
   * Busca todas as notas de atividades
   * @param {Object} filters - Filtros opcionais (alunoId, materiaId, turmaId, periodo, tipo, atividadeId)
   * @returns {Promise<Object>} - Lista de notas
   */
  async getAll(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.alunoId) params.append("alunoId", filters.alunoId);
      if (filters.materiaId) params.append("materiaId", filters.materiaId);
      if (filters.turmaId) params.append("turmaId", filters.turmaId);
      if (filters.periodo) params.append("periodo", filters.periodo);
      if (filters.tipo) params.append("tipo", filters.tipo);
      if (filters.atividadeId) params.append("atividadeId", filters.atividadeId);
      
      const queryString = params.toString();
      const url = `/nota-atividade${queryString ? `?${queryString}` : ""}`;
      const response = await api.get(url);
      
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar notas",
        data: [],
      };
    }
  }

  /**
   * Busca uma nota específica por ID
   * @param {string} id - ID da nota
   * @returns {Promise<Object>} - Dados da nota
   */
  async getById(id) {
    try {
      const response = await api.get(`/nota-atividade/${id}`);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar nota",
      };
    }
  }

  /**
   * Adiciona ou atualiza uma nota
   * @param {string} id - ID da nota
   * @param {number} valor - Valor da nota (0-10)
   * @returns {Promise<Object>}
   */
  async adicionarNota(id, valor) {
    try {
      const response = await api.post(`/nota-atividade/${id}/nota`, { valor });
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao adicionar nota",
      };
    }
  }
}

export default new NotaAtividadeService();
