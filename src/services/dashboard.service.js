import api from "./api";

class DashboardService {
  /**
   * Busca as estatísticas do dashboard baseado no role do usuário
   * @returns {Promise<Object>} - Estatísticas (materias, alunos, professores/cursos, turmas)
   */
  async getStats() {
    try {
      const response = await api.get("/dashboard/stats");
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar estatísticas",
        data: {
          materias: 0,
          alunos: 0,
          professores: 0,
          turmas: 0,
        },
      };
    }
  }
}

export default new DashboardService();
