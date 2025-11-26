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
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const TurmasListScreen = () => {
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const fetchTurmas = useCallback(async () => {
    try {
      setError(null);
      const response = await academicoService.getTurmas();
      const turmasData = response.data.results || response.data;
      setTurmas(Array.isArray(turmasData) ? turmasData : []);
    } catch (err) {
      setError('Erro ao carregar turmas. Tente novamente.');
      console.error('Erro ao buscar turmas:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTurmas();
  }, [fetchTurmas]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTurmas();
  }, [fetchTurmas]);

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="google-classroom" size={28} color={theme.colors.white} />
        </View>
        <View style={styles.info}>
          <Text style={styles.nome}>{item.nome}</Text>
          <Text style={styles.detail}>Ano Letivo: {item.ano_letivo}</Text>
          {item.professor_principal && (
            <Text style={[styles.detail, { color: theme.colors.primary, fontWeight: '600' }]}>
              Prof.: {typeof item.professor_principal === 'object' 
                ? item.professor_principal.usuario?.nome_completo || 'N/A'
                : 'N/A'}
            </Text>
          )}
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
    return renderStatus('alert-circle-outline', error, 'Tentar Novamente', fetchTurmas);
  }

  return (
    <View style={styles.container}>
      {turmas.length === 0 ? (
        renderStatus('school-outline', 'Nenhuma turma encontrada.')
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
    backgroundColor: theme.colors.primary, // Cor temática
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
    marginBottom: theme.spacing.xs,
  },
  detail: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
});

export default TurmasListScreen;

