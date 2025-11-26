import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { agendaService } from '../../services/agendaService';
import { useRoute } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const AgendaDetalheScreen = () => {
  const route = useRoute();
  const { agendaId } = route.params;
  const [agenda, setAgenda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAgendaDetalhe = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await agendaService.getAgendaDetalhe(agendaId);
      setAgenda(response.data);
    } catch (err) {
      setError('Erro ao carregar detalhes da agenda.');
      console.error('Erro ao buscar detalhes da agenda:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [agendaId]);

  useEffect(() => {
    fetchAgendaDetalhe();
  }, [fetchAgendaDetalhe]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAgendaDetalhe();
  };

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

  const renderAtividade = (atividade, index) => (
    <View key={index} style={styles.itemCard}>
      <MaterialCommunityIcons name="clipboard-text-outline" size={24} color={theme.colors.primary} style={styles.itemIcon} />
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{atividade.tipo} ({atividade.horario})</Text>
        <Text style={styles.itemSubtitle}>{atividade.observacao}</Text>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return renderStatus('alert-circle-outline', error, 'Tentar Novamente', fetchAgendaDetalhe);
  }

  if (!agenda) {
    return renderStatus('calendar-question', 'Agenda não encontrada.');
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{agenda.aluno.nome_completo}</Text>
        <Text style={styles.headerSubtitle}>
          <MaterialCommunityIcons name="calendar" size={16} color={theme.colors.textSecondary} />
          {' '}{new Date(agenda.data).toLocaleDateString('pt-BR')}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Atividades do Dia</Text>
        {agenda.atividades && agenda.atividades.length > 0 ? (
          agenda.atividades.map(renderAtividade)
        ) : (
          <Text style={styles.emptyText}>Nenhuma atividade registrada.</Text>
        )}
      </View>

      {agenda.observacoes_professor ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observações do Professor</Text>
          <View style={styles.itemCard}>
            <MaterialCommunityIcons name="comment-text-outline" size={24} color={theme.colors.primary} style={styles.itemIcon} />
            <View style={styles.itemContent}>
              <Text style={styles.itemSubtitle}>{agenda.observacoes_professor}</Text>
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Criado em: {new Date(agenda.data_criacao).toLocaleString('pt-BR')}</Text>
        <Text style={styles.footerText}>Atualizado em: {new Date(agenda.data_atualizacao).toLocaleString('pt-BR')}</Text>
      </View>
    </ScrollView>
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
    backgroundColor: theme.colors.background,
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
  header: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.primary,
  },
  headerSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  section: {
    ...theme.components.card,
    marginHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.m,
    padding: theme.spacing.m,
  },
  sectionTitle: {
    ...theme.typography.h3,
    fontSize: 18,
    marginBottom: theme.spacing.m,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.background,
    borderRadius: theme.shape.borderRadiusSmall,
    padding: theme.spacing.s,
    marginBottom: theme.spacing.s,
  },
  itemIcon: {
    marginRight: theme.spacing.m,
    marginTop: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
  },
  itemSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  footer: {
    padding: theme.spacing.m,
    alignItems: 'center',
  },
  footerText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
});

export default AgendaDetalheScreen;