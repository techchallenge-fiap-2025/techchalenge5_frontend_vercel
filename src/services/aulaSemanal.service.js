import api from "./api";

class AulaSemanalService {
  /**
   * Busca todas as aulas semanais (admin vê todas, professor vê suas, aluno vê da turma)
   * @returns {Promise<Object>} - Lista de aulas semanais
   */
  async getAll() {
    try {
      const response = await api.get("/aula-semanal");
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar aulas semanais",
        data: [],
      };
    }
  }

  /**
   * Cria uma nova aula semanal
   * @param {Object} aulaData - Dados da aula semanal
   * @returns {Promise<Object>} - Resultado da operação
   */
  async create(aulaData) {
    try {
      const response = await api.post("/aula-semanal", aulaData);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao criar aula semanal",
      };
    }
  }

  /**
   * Deleta uma aula semanal
   * @param {string} aulaId - ID da aula semanal
   * @returns {Promise<Object>} - Resultado da operação
   */
  async delete(aulaId) {
    try {
      const response = await api.delete(`/aula-semanal/${aulaId}`);
      // DELETE retorna 204 (No Content), então response pode ser null
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao deletar aula semanal",
      };
    }
  }
}

export default new AulaSemanalService();
