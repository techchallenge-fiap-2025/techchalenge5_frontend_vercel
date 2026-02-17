import api from "./api";

class AttendanceService {
  /**
   * Busca todas as presenças (filtrado por role)
   * @param {Object} filters - Filtros opcionais (turmaId, materiaId, dataInicio, dataFim)
   * @returns {Promise<Object>} - Lista de presenças
   */
  async getAll(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.turmaId) {
        params.append("turmaId", filters.turmaId);
      }
      if (filters.materiaId) {
        params.append("materiaId", filters.materiaId);
      }
      if (filters.dataInicio) {
        params.append("dataInicio", filters.dataInicio);
      }
      if (filters.dataFim) {
        params.append("dataFim", filters.dataFim);
      }
      
      const queryString = params.toString();
      const url = `/attendance${queryString ? `?${queryString}` : ""}`;
      const response = await api.get(url);
      
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar presenças",
        data: [],
      };
    }
  }

  /**
   * Marca presença/falta para alunos em uma aula
   * @param {Object} data - { turmaId, materiaId, data, alunos: [{ alunoId, presente }] }
   * @returns {Promise<Object>}
   */
  async marcarPresenca(data) {
    try {
      const response = await api.post("/attendance", data);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      // Capturar erro da API e retornar informações detalhadas
      return {
        success: false,
        error: error,
      };
    }
  }
}

export default new AttendanceService();
