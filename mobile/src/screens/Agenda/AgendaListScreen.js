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
import { useAuth } from '../../contexts/AuthContext';
import { agendaService } from '../../services/agendaService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FAB from '../../components/FAB';

const AgendaListScreen = () => {
  const [agendas, setAgendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const canCreate = user?.tipo_usuario === 'PROFESSOR' || user?.is_staff || user?.tipo_usuario === 'ADMIN';

  const fetchAgendas = useCallback(async () => {
    try {
      setError(null);
      const response = await agendaService.getAgendas();
      const data = response.data.results || response.data || [];
      setAgendas(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Erro ao carregar agendas. Tente novamente.');
      console.error('Erro ao buscar agendas:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchAgendas();
    }, [fetchAgendas])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAgendas();
  }, [fetchAgendas]);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('AgendaDetalhe', { agendaId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.aluno.nome_completo.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.nome}>{item.aluno.nome_completo}</Text>
          <Text style={styles.detail}>
            <MaterialCommunityIcons name="calendar" size={14} color={theme.colors.textSecondary} />
            {' '}{new Date(item.data).toLocaleDateString('pt-BR')}
          </Text>
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
    return renderStatus('alert-circle-outline', error, 'Tentar Novamente', onRefresh);
  }

  return (
    <View style={styles.container}>
      {agendas.length === 0 ? (
        renderStatus('calendar-search', 'Nenhuma agenda encontrada.')
      ) : (
        <FlatList
          data={agendas}
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
      {canCreate && (
        <FAB onPress={() => navigation.navigate('AgendaCreate')} />
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
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: 'bold',
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
    alignItems: 'center',
  },
});

export default AgendaListScreen;