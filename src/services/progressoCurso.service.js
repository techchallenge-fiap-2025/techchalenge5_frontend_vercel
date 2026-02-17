import api from "./api";

class ProgressoCursoService {
  /**
   * Busca os cursos do aluno logado
   * @returns {Promise<Object>} - Lista de cursos e progresso
   */
  async getMeusCursos() {
    try {
      const response = await api.get("/progresso-curso/meus-cursos");
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar cursos",
        data: {
          totalCursos: 0,
          cursosCompletos: 0,
          cursosEmAndamento: 0,
          progressos: [],
        },
      };
    }
  }

  /**
   * Busca os cursos de um aluno específico (para admin)
   * @param {string} alunoId - ID do aluno
   * @returns {Promise<Object>} - Lista de cursos e progresso do aluno
   */
  async getCursosAluno(alunoId) {
    try {
      const response = await api.get(`/progresso-curso/aluno/${alunoId}`);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar cursos do aluno",
        data: {
          totalCursos: 0,
          cursosCompletos: 0,
          cursosEmAndamento: 0,
          progressos: [],
        },
      };
    }
  }

  /**
   * Busca o progresso de um curso específico
   * @param {string} cursoId - ID do curso
   * @returns {Promise<Object>} - Progresso do curso
   */
  async getProgresso(cursoId) {
    try {
      const response = await api.get(`/progresso-curso/curso/${cursoId}`);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar progresso",
      };
    }
  }

  /**
   * Marca uma aula como concluída (vídeo ou texto)
   * @param {Object} data - Dados da aula (cursoId, capituloOrdem, aulaOrdem, tipo, timestampVideo)
   * @returns {Promise<Object>} - Resultado da operação
   */
  async marcarAulaConcluida(data) {
    try {
      const response = await api.post("/progresso-curso/marcar-aula", data);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao marcar aula como concluída",
      };
    }
  }

  /**
   * Salva o timestamp do vídeo
   * @param {Object} data - Dados do vídeo (cursoId, capituloOrdem, aulaOrdem, timestampVideo)
   * @returns {Promise<Object>} - Resultado da operação
   */
  async salvarTimestampVideo(data) {
    try {
      const response = await api.post(
        "/progresso-curso/salvar-timestamp",
        data,
      );
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao salvar timestamp do vídeo",
      };
    }
  }
}

export default new ProgressoCursoService();
