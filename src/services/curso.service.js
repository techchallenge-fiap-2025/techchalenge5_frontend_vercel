import api from "./api";

class CursoService {
  /**
   * Cria um novo curso
   * @param {FormData} formData - FormData com dados do curso e arquivos
   * @returns {Promise<Object>} - Curso criado
   */
  async create(formData) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000/api"}/curso`,
        {
          method: "POST",
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || "Erro ao criar curso",
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao criar curso",
      };
    }
  }

  /**
   * Busca todos os cursos disponíveis
   * @param {Object} filters - Filtros opcionais (ordem, materiaId)
   * @returns {Promise<Object>} - Lista de cursos
   */
  async getAll(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.ordem) params.append("ordem", filters.ordem);
      if (filters.materiaId) params.append("materiaId", filters.materiaId);
      
      const queryString = params.toString();
      const url = `/curso${queryString ? `?${queryString}` : ""}`;
      const response = await api.get(url);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar cursos",
        data: [],
      };
    }
  }

  /**
   * Busca um curso específico por ID
   * @param {string} id - ID do curso
   * @returns {Promise<Object>} - Dados do curso
   */
  async getById(id) {
    try {
      const response = await api.get(`/curso/${id}`);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao buscar curso",
      };
    }
  }

  /**
   * Atualiza um curso
   * @param {string} id - ID do curso
   * @param {Object} data - Dados para atualizar
   * @returns {Promise<Object>} - Curso atualizado
   */
  async update(id, data) {
    try {
      const response = await api.put(`/curso/${id}`, data);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao atualizar curso",
      };
    }
  }

  /**
   * Deleta um curso
   * @param {string} id - ID do curso
   * @returns {Promise<Object>} - Resultado da operação
   */
  async delete(id) {
    try {
      const response = await api.delete(`/curso/${id}`);
      // Se a resposta for null (status 204), considerar sucesso
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao deletar curso",
      };
    }
  }

  /**
   * Deleta um capítulo de um curso
   * @param {string} cursoId - ID do curso
   * @param {number} capituloIndex - Índice do capítulo
   * @returns {Promise<Object>} - Resultado da operação
   */
  async deleteCapitulo(cursoId, capituloIndex) {
    try {
      const response = await api.delete(
        `/curso/${cursoId}/capitulos/${capituloIndex}`,
      );
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao deletar capítulo",
      };
    }
  }

  /**
   * Deleta uma aula de um capítulo
   * @param {string} cursoId - ID do curso
   * @param {number} capituloIndex - Índice do capítulo
   * @param {number} aulaIndex - Índice da aula
   * @returns {Promise<Object>} - Resultado da operação
   */
  async deleteAula(cursoId, capituloIndex, aulaIndex) {
    try {
      const response = await api.delete(
        `/curso/${cursoId}/capitulos/${capituloIndex}/aulas/${aulaIndex}`,
      );
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao deletar aula",
      };
    }
  }

  /**
   * Verifica se o aluno está inscrito no curso
   * @param {string} cursoId - ID do curso
   * @returns {Promise<Object>} - Resultado da verificação
   */
  async verificarInscricao(cursoId) {
    try {
      const response = await api.get(`/curso/${cursoId}/verificar-inscricao`);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao verificar inscrição",
      };
    }
  }

  /**
   * Aluno se inscreve no curso
   * @param {string} cursoId - ID do curso
   * @returns {Promise<Object>} - Resultado da operação
   */
  async inscrever(cursoId) {
    try {
      const response = await api.post(`/curso/${cursoId}/inscrever`);
      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Erro ao inscrever no curso",
      };
    }
  }
}

export default new CursoService();
