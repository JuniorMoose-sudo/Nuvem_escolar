import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { agendaService } from '../../services/agendaService';
import { useRoute } from '@react-navigation/native';

const COLORS = {
  azulClaro: '#4A90E2',
  laranja: '#F5A623',
  branco: '#FFFFFF',
  cinzaClaro: '#9B9B9B',
};

const AgendaDetalheScreen = () => {
  const route = useRoute();
  const { agendaId } = route.params;
  const [agenda, setAgenda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAgendaDetalhe();
  }, [agendaId]);

  const fetchAgendaDetalhe = async () => {
    try {
      setLoading(true);
      const response = await agendaService.getAgendaDetalhe(agendaId);
      setAgenda(response.data);
    } catch (err) {
      setError('Erro ao carregar detalhes da agenda. Tente novamente.');
      console.error('Erro ao buscar detalhes da agenda:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.azulClaro} />
        <Text style={styles.loadingText}>Carregando detalhes da agenda...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAgendaDetalhe}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!agenda) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Agenda não encontrada.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.alunoNome}>{agenda.aluno.nome_completo}</Text>
        <Text style={styles.data}>Data: {new Date(agenda.data).toLocaleDateString('pt-BR')}</Text>

        <Text style={styles.sectionTitle}>Atividades do Dia:</Text>
        {agenda.atividades && agenda.atividades.length > 0 ? (
          agenda.atividades.map((atividade, index) => (
            <View key={index} style={styles.atividadeItem}>
              <Text style={styles.atividadeTipo}>{atividade.tipo} ({atividade.horario})</Text>
              <Text style={styles.atividadeObservacao}>{atividade.observacao}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noActivities}>Nenhuma atividade registrada para este dia.</Text>
        )}

        {agenda.observacoes_professor ? (
          <>
            <Text style={styles.sectionTitle}>Observações do Professor:</Text>
            <Text style={styles.observacoes}>{agenda.observacoes_professor}</Text>
          </>
        ) : null}

        <Text style={styles.footerText}>Criado em: {new Date(agenda.data_criacao).toLocaleString('pt-BR')}</Text>
        <Text style={styles.footerText}>Última atualização: {new Date(agenda.data_atualizacao).toLocaleString('pt-BR')}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.branco,
    padding: 15,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.branco,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.cinzaClaro,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.azulClaro,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryButtonText: {
    color: COLORS.branco,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: COLORS.cinzaClaro,
  },
  card: {
    backgroundColor: COLORS.branco,
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  alunoNome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.azulClaro,
    marginBottom: 5,
  },
  data: {
    fontSize: 16,
    color: COLORS.cinzaClaro,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.laranja,
    marginTop: 15,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cinzaClaro,
    paddingBottom: 5,
  },
  atividadeItem: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  atividadeTipo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  atividadeObservacao: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
  noActivities: {
    fontSize: 14,
    color: COLORS.cinzaClaro,
    fontStyle: 'italic',
  },
  observacoes: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.cinzaClaro,
    marginTop: 10,
    textAlign: 'right',
  },
});

export default AgendaDetalheScreen;