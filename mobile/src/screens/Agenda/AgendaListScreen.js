import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { agendaService } from '../../services/agendaService';
import { useNavigation } from '@react-navigation/native';

const COLORS = {
  azulClaro: '#4A90E2',
  branco: '#FFFFFF',
  cinzaClaro: '#9B9B9B',
};

const AgendaListScreen = () => {
  const [agendas, setAgendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    fetchAgendas();
  }, []);

  const fetchAgendas = async () => {
    try {
      setLoading(true);
      const response = await agendaService.getAgendas();
      setAgendas(response.data.results); // Supondo que a API retorna um objeto com 'results'
    } catch (err) {
      setError('Erro ao carregar agendas. Tente novamente.');
      console.error('Erro ao buscar agendas:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.agendaCard} 
      onPress={() => navigation.navigate('AgendaDetalhe', { agendaId: item.id })}
    >
      <Text style={styles.alunoNome}>{item.aluno.nome_completo}</Text>
      <Text style={styles.agendaData}>Data: {new Date(item.data).toLocaleDateString('pt-BR')}</Text>
      {item.atividades && item.atividades.length > 0 && (
        <Text style={styles.atividadePreview}>
          Atividades: {item.atividades[0].tipo} ({item.atividades[0].horario})
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.azulClaro} />
        <Text style={styles.loadingText}>Carregando agendas...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAgendas}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {agendas.length === 0 ? (
        <Text style={styles.emptyText}>Nenhuma agenda encontrada.</Text>
      ) : (
        <FlatList
          data={agendas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.branco,
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
  listContent: {
    padding: 10,
  },
  agendaCard: {
    backgroundColor: COLORS.branco,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  alunoNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.azulClaro,
  },
  agendaData: {
    fontSize: 14,
    color: COLORS.cinzaClaro,
    marginTop: 5,
  },
  atividadePreview: {
    fontSize: 14,
    color: COLORS.cinzaClaro,
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: COLORS.cinzaClaro,
  },
});

export default AgendaListScreen;