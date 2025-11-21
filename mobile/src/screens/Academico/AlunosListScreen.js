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

const AlunosListScreen = () => {
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    fetchAlunos();
  }, []);

  const fetchAlunos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await academicoService.getAlunos();
      // A API pode retornar um array direto ou um objeto com 'results' (paginação)
      const alunosData = response.data.results || response.data;
      setAlunos(Array.isArray(alunosData) ? alunosData : []);
    } catch (err) {
      setError('Erro ao carregar alunos. Tente novamente.');
      console.error('Erro ao buscar alunos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlunos();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.alunoCard}>
      <View style={styles.alunoHeader}>
        <View style={styles.alunoAvatar}>
          <Text style={styles.alunoAvatarText}>
            {item.nome_completo.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.alunoInfo}>
          <Text style={styles.alunoNome}>{item.nome_completo}</Text>
          <Text style={styles.alunoMatricula}>Matrícula: {item.matricula}</Text>
          {item.turma && (
            <Text style={styles.alunoTurma}>Turma: {item.turma.nome || item.turma}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.azulClaro} />
        <Text style={styles.loadingText}>Carregando alunos...</Text>
      </View>
    );
  }

  if (error && !loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAlunos}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {alunos.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Nenhum aluno encontrado.</Text>
        </View>
      ) : (
        <FlatList
          data={alunos}
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
  alunoCard: {
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
  alunoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alunoAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.azulClaro,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alunoAvatarText: {
    color: COLORS.branco,
    fontSize: 20,
    fontWeight: 'bold',
  },
  alunoInfo: {
    flex: 1,
  },
  alunoNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  alunoMatricula: {
    fontSize: 14,
    color: COLORS.cinzaClaro,
    marginBottom: 2,
  },
  alunoTurma: {
    fontSize: 14,
    color: COLORS.laranja,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: COLORS.cinzaClaro,
    marginTop: 20,
  },
});

export default AlunosListScreen;

