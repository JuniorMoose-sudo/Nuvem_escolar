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

const COLORS = {
  azulClaro: '#4A90E2',
  laranja: '#F5A623',
  branco: '#FFFFFF',
  cinzaClaro: '#9B9B9B',
};

const MateriasListScreen = () => {
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMaterias();
  }, []);

  const fetchMaterias = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await academicoService.getMaterias();
      // A API pode retornar um array direto ou um objeto com 'results' (paginação)
      const materiasData = response.data.results || response.data;
      setMaterias(Array.isArray(materiasData) ? materiasData : []);
    } catch (err) {
      setError('Erro ao carregar matérias. Tente novamente.');
      console.error('Erro ao buscar matérias:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMaterias();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.materiaCard}>
      <View style={styles.materiaHeader}>
        <View style={styles.materiaIcon}>
          <Text style={styles.materiaIconText}>📖</Text>
        </View>
        <View style={styles.materiaInfo}>
          <Text style={styles.materiaNome}>{item.nome}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.azulClaro} />
        <Text style={styles.loadingText}>Carregando matérias...</Text>
      </View>
    );
  }

  if (error && !loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMaterias}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {materias.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Nenhuma matéria encontrada.</Text>
        </View>
      ) : (
        <FlatList
          data={materias}
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
  materiaCard: {
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
    borderLeftColor: COLORS.azulClaro,
  },
  materiaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  materiaIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.azulClaro,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  materiaIconText: {
    fontSize: 24,
  },
  materiaInfo: {
    flex: 1,
  },
  materiaNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.cinzaClaro,
    marginTop: 20,
  },
});

export default MateriasListScreen;

