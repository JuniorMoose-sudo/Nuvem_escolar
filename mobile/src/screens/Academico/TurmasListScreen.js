import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { academicoService } from '../../services/academicoService';
import { useNavigation } from '@react-navigation/native';

const COLORS = {
  azulClaro: '#4A90E2',
  laranja: '#F5A623',
  branco: '#FFFFFF',
  cinzaClaro: '#9B9B9B',
};

const TurmasListScreen = () => {
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    fetchTurmas();
  }, []);

  const fetchTurmas = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await academicoService.getTurmas();
      // A API pode retornar um array direto ou um objeto com 'results' (paginação)
      const turmasData = response.data.results || response.data;
      setTurmas(Array.isArray(turmasData) ? turmasData : []);
    } catch (err) {
      setError('Erro ao carregar turmas. Tente novamente.');
      console.error('Erro ao buscar turmas:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTurmas();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.turmaCard}>
      <View style={styles.turmaHeader}>
        <View style={styles.turmaIcon}>
          <Text style={styles.turmaIconText}>📚</Text>
        </View>
        <View style={styles.turmaInfo}>
          <Text style={styles.turmaNome}>{item.nome}</Text>
          <Text style={styles.turmaAno}>Ano Letivo: {item.ano_letivo}</Text>
          {item.professor_principal && (
            <Text style={styles.turmaProfessor}>
              Professor: {typeof item.professor_principal === 'object' 
                ? item.professor_principal.usuario?.nome_completo || 'N/A'
                : 'N/A'}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.azulClaro} />
        <Text style={styles.loadingText}>Carregando turmas...</Text>
      </View>
    );
  }

  if (error && !loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchTurmas}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {turmas.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Nenhuma turma encontrada.</Text>
        </View>
      ) : (
        <FlatList
          data={turmas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.azulClaro]}
            />
          }
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
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
    fontSize: 16,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: COLORS.azulClaro,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: COLORS.branco,
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContent: {
    padding: 16,
  },
  turmaCard: {
    backgroundColor: COLORS.branco,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.laranja,
  },
  turmaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  turmaIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.laranja,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  turmaIconText: {
    fontSize: 24,
  },
  turmaInfo: {
    flex: 1,
  },
  turmaNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  turmaAno: {
    fontSize: 14,
    color: COLORS.cinzaClaro,
    marginBottom: 2,
  },
  turmaProfessor: {
    fontSize: 14,
    color: COLORS.azulClaro,
    fontWeight: '500',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.cinzaClaro,
    marginTop: 20,
  },
});

export default TurmasListScreen;

