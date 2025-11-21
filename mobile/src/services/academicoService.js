import api from './api';

/**
 * Serviço para consumir endpoints do módulo acadêmico
 */
export const academicoService = {
  /**
   * Lista todos os alunos (filtrados por perfil do usuário)
   */
  getAlunos: async () => {
    const response = await api.get('/academico/alunos/');
    return response;
  },

  /**
   * Obtém detalhes de um aluno específico
   */
  getAluno: async (alunoId) => {
    const response = await api.get(`/academico/alunos/${alunoId}/`);
    return response;
  },

  /**
   * Lista todas as turmas (filtradas por perfil do usuário)
   */
  getTurmas: async () => {
    const response = await api.get('/academico/turmas/');
    return response;
  },

  /**
   * Obtém detalhes de uma turma específica
   */
  getTurma: async (turmaId) => {
    const response = await api.get(`/academico/turmas/${turmaId}/`);
    return response;
  },

  /**
   * Lista todas as matérias (filtradas por perfil do usuário)
   */
  getMaterias: async () => {
    const response = await api.get('/academico/materias/');
    return response;
  },

  /**
   * Obtém detalhes de uma matéria específica
   */
  getMateria: async (materiaId) => {
    const response = await api.get(`/academico/materias/${materiaId}/`);
    return response;
  },
};

