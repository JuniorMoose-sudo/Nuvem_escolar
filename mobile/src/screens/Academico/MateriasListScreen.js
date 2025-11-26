import React, { useState, useEffect, useCallback } from 'react';
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
import { theme } from '../../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MateriasListScreen = () => {
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMaterias = useCallback(async () => {
    try {
      setError(null);
      const response = await academicoService.getMaterias();
      const materiasData = response.data.results || response.data;
      setMaterias(Array.isArray(materiasData) ? materiasData : []);
    } catch (err) {
      setError('Erro ao carregar matérias. Tente novamente.');
      console.error('Erro ao buscar matérias:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterias();
  }, [fetchMaterias]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMaterias();
  }, [fetchMaterias]);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="book-open-variant" size={28} color={theme.colors.white} />
        </View>
        <View style={styles.info}>
          <Text style={styles.nome}>{item.nome}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderStatus = (icon, message, buttonText, onButtonPress) => (
    <View style={styles.center}>
      <MaterialCommunityIcons name={icon} size={60} color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.m }} />
      <Text style={styles.statusText}>{message}</Text>
      {buttonText && (
        <TouchableOpacity style={styles.button} onPress={onButtonPress}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error && !loading) {
    return renderStatus('alert-circle-outline', error, 'Tentar Novamente', fetchMaterias);
  }

  return (
    <View style={styles.container}>
      {materias.length === 0 ? (
        renderStatus('book-search-outline', 'Nenhuma matéria encontrada.')
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
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
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
    backgroundColor: theme.colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.l,
  },
  statusText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.m,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.shape.borderRadiusMedium,
    ...theme.shadows.light,
  },
  buttonText: {
    ...theme.typography.button,
    fontSize: 16,
  },
  listContent: {
    padding: theme.spacing.m,
  },
  card: {
    ...theme.components.card,
    marginBottom: theme.spacing.m,
    ...theme.shadows.light,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  info: {
    flex: 1,
  },
  nome: {
    ...theme.typography.h3,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
});

export default MateriasListScreen;

