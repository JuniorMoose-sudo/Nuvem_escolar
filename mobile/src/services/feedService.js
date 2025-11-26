import api from './api';

/**
 * Serviço para consumir endpoints do feed (momentos e comunicados)
 */
export const feedService = {
  getMomentos: async (page = 1) => {
    const response = await api.get(`/comunicacao/momentos/?page=${page}`);
    return response;
  },
  getMomento: async (momentoId) => {
    const response = await api.get(`/comunicacao/momentos/${momentoId}/`);
    return response;
  },
  criarMomento: async (dados) => {
    // dados pode ser { descricao, data_momento, turma_id, alunos_ids, file_keys }
    const response = await api.post('/comunicacao/momentos/', dados);
    return response.data;
  },
  criarMomentoFormData: async (formData) => {
    const response = await api.post('/comunicacao/momentos/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  getComunicados: async (page = 1) => {
    const response = await api.get(`/comunicacao/comunicados/?page=${page}`);
    return response;
  },
  getComunicado: async (comunicadoId) => {
    const response = await api.get(`/comunicacao/comunicados/${comunicadoId}/`);
    return response;
  },
  criarComunicado: async (dados) => {
    const response = await api.post('/comunicacao/comunicados/', dados);
    return response;
  },
  curtirMomento: async (momentoId) => {
    const response = await api.post(`/comunicacao/momentos/${momentoId}/curtir/`);
    return response;
  },
  descurtirMomento: async (momentoId) => {
    const response = await api.delete(`/comunicacao/momentos/${momentoId}/curtir/`);
    return response;
  },
  curtirComunicado: async (comunicadoId) => {
    const response = await api.post(`/comunicacao/comunicados/${comunicadoId}/curtir/`);
    return response;
  },
  descurtirComunicado: async (comunicadoId) => {
    const response = await api.delete(`/comunicacao/comunicados/${comunicadoId}/curtir/`);
    return response;
  },
  getComentariosMomento: async (momentoId) => {
    const response = await api.get(`/comunicacao/comentarios/?momento_id=${momentoId}`);
    return response;
  },
  getComentariosComunicado: async (comunicadoId) => {
    const response = await api.get(`/comunicacao/comentarios/?comunicado_id=${comunicadoId}`);
    return response;
  },
  criarComentarioMomento: async (momentoId, texto) => {
    const response = await api.post('/comunicacao/comentarios/', { momento: momentoId, texto });
    return response;
  },
  criarComentarioComunicado: async (comunicadoId, texto) => {
    const response = await api.post('/comunicacao/comentarios/', { comunicado: comunicadoId, texto });
    return response;
  },
};

export default feedService;

