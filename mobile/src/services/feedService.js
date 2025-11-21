import api from './api';

/**
 * Serviço para consumir endpoints do feed (momentos e comunicados)
 */
export const feedService = {
  /**
   * Lista todos os momentos (filtrados por perfil do usuário)
   * @param {number} page - Número da página (para paginação)
   */
  getMomentos: async (page = 1) => {
    const response = await api.get(`/comunicacao/momentos/?page=${page}`);
    return response;
  },

  /**
   * Obtém detalhes de um momento específico
   */
  getMomento: async (momentoId) => {
    const response = await api.get(`/comunicacao/momentos/${momentoId}/`);
    return response;
  },

  /**
   * Cria um novo momento (apenas para professores)
   * @param {FormData} formData - Dados do momento (arquivo, tipo, descricao, etc.)
   */
  criarMomento: async (formData) => {
    const response = await api.post('/comunicacao/momentos/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  },

  /**
   * Lista todos os comunicados (filtrados por perfil do usuário)
   * @param {number} page - Número da página (para paginação)
   */
  getComunicados: async (page = 1) => {
    const response = await api.get(`/comunicacao/comunicados/?page=${page}`);
    return response;
  },

  /**
   * Obtém detalhes de um comunicado específico
   */
  getComunicado: async (comunicadoId) => {
    const response = await api.get(`/comunicacao/comunicados/${comunicadoId}/`);
    return response;
  },

  /**
   * Cria um novo comunicado (apenas para professores e admins)
   */
  criarComunicado: async (dados) => {
    const response = await api.post('/comunicacao/comunicados/', dados);
    return response;
  },

  /**
   * Curtir um momento
   */
  curtirMomento: async (momentoId) => {
    const response = await api.post(`/comunicacao/momentos/${momentoId}/curtir/`);
    return response;
  },

  /**
   * Descurtir um momento
   */
  descurtirMomento: async (momentoId) => {
    const response = await api.delete(`/comunicacao/momentos/${momentoId}/curtir/`);
    return response;
  },

  /**
   * Curtir um comunicado
   */
  curtirComunicado: async (comunicadoId) => {
    const response = await api.post(`/comunicacao/comunicados/${comunicadoId}/curtir/`);
    return response;
  },

  /**
   * Descurtir um comunicado
   */
  descurtirComunicado: async (comunicadoId) => {
    const response = await api.delete(`/comunicacao/comunicados/${comunicadoId}/curtir/`);
    return response;
  },

  /**
   * Lista comentários de um momento
   */
  getComentariosMomento: async (momentoId) => {
    const response = await api.get(`/comunicacao/comentarios/?momento_id=${momentoId}`);
    return response;
  },

  /**
   * Lista comentários de um comunicado
   */
  getComentariosComunicado: async (comunicadoId) => {
    const response = await api.get(`/comunicacao/comentarios/?comunicado_id=${comunicadoId}`);
    return response;
  },

  /**
   * Cria um comentário em um momento
   */
  criarComentarioMomento: async (momentoId, texto) => {
    const response = await api.post('/comunicacao/comentarios/', {
      momento: momentoId,
      texto: texto,
    });
    return response;
  },

  /**
   * Cria um comentário em um comunicado
   */
  criarComentarioComunicado: async (comunicadoId, texto) => {
    const response = await api.post('/comunicacao/comentarios/', {
      comunicado: comunicadoId,
      texto: texto,
    });
    return response;
  },
};

