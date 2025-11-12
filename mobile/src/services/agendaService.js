import api from './api';

/**
 * Busca a lista de agendas diárias.
 * O backend filtra automaticamente com base no perfil do usuário (responsável/professor).
 */
const getAgendas = () => {
  return api.get('/comunicacao/agendas/');
};

/**
 * Busca os detalhes de uma agenda específica.
 */
const getAgendaDetalhe = (id) => {
  return api.get(`/comunicacao/agendas/${id}/`);
};

/**
 * Cria uma nova agenda diária (apenas para professores).
 * @param {object} dadosAgenda - { aluno_id, data, atividades, observacoes_professor }
 */
const criarAgenda = (dadosAgenda) => {
  return api.post('/comunicacao/agendas/', dadosAgenda);
};

export const agendaService = {
  getAgendas,
  getAgendaDetalhe,
  criarAgenda,
};
