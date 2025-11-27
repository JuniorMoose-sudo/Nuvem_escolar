import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Image,
  TouchableOpacity,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { feedService } from '../../services/feedService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import FAB from '../../components/FAB';
import { theme } from '../../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const FeedScreen = () => {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  const { user } = useAuth();
  // Permissões granulares para criação de conteúdo
  const canCreateComunicado = user?.tipo_usuario === 'PROFESSOR' || user?.tipo_usuario === 'ADMIN_ESCOLA';
  const canCreateMomento = user?.tipo_usuario === 'PROFESSOR';
  const canCreate = canCreateComunicado || canCreateMomento; // Mostra o FAB se o usuário puder criar qualquer tipo de post
  const navigation = useNavigation();

  const loadFeed = useCallback(async () => {
    try {
      setError(null);
      const [momentosRes, comunicadosRes] = await Promise.all([
        feedService.getMomentos(),
        feedService.getComunicados(),
      ]);

      const momentos = (momentosRes.data.results || []).map(m => ({ ...m, postType: 'momento' }));
      const comunicados = (comunicadosRes.data.results || []).map(c => ({ ...c, postType: 'comunicado' }));
      
      const combined = [...momentos, ...comunicados].sort((a, b) => 
        new Date(b.data_criacao || b.data_publicacao) - new Date(a.data_criacao || a.data_publicacao)
      );

      setFeed(combined);
    } catch (err) {
      setError('Erro ao carregar o feed. Tente novamente.');
      console.error('Erro ao carregar feed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadFeed();
    }, [loadFeed])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadFeed();
  };

  const handleAction = async (item, action) => {
    try {
      const service = item.postType === 'momento' ? feedService.curtirMomento : feedService.curtirComunicado;
      await service(item.id);
      loadFeed(); // Recarrega o feed para refletir a mudança
    } catch (err) {
      Alert.alert('Erro', `Não foi possível ${action} o item. Tente novamente.`);
    }
  };

  const navigateToCreate = (screen) => {
    setShowCreateOptions(false);
    navigation.navigate(screen);
  };

  const renderItem = ({ item }) => {
    const isMomento = item.postType === 'momento';
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Image
            style={styles.avatar}
            source={{ uri: item.autor?.avatar_url || 'https://via.placeholder.com/40' }}
          />
          <View>
            <Text style={styles.autorNome}>{item.autor?.nome_completo || 'Autor Desconhecido'}</Text>
            <Text style={styles.data}>
              {new Date(item.data_criacao || item.data_publicacao).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
            </Text>
          </View>
        </View>

        {isMomento ? (
          <>
            {item.arquivo_url && <Image source={{ uri: item.arquivo_url }} style={styles.imagem} />}
            {item.descricao && <Text style={styles.conteudo}>{item.descricao}</Text>}
          </>
        ) : (
          <>
            <Text style={styles.titulo}>{item.titulo}</Text>
            <Text style={styles.conteudo}>{item.conteudo}</Text>
          </>
        )}

        <View style={styles.cardFooter}>
          <TouchableOpacity style={styles.acaoButton} onPress={() => handleAction(item, 'curtir')}>
            <MaterialCommunityIcons name={item.curtido_por_usuario ? 'heart' : 'heart-outline'} size={22} color={item.curtido_por_usuario ? theme.colors.error : theme.colors.textSecondary} />
            <Text style={styles.acaoTexto}>{item.total_curtidas || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acaoButton}>
            <MaterialCommunityIcons name="comment-text-multiple-outline" size={22} color={theme.colors.textSecondary} />
            <Text style={styles.acaoTexto}>{item.total_comentarios || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderStatus = (icon, message) => (
    <View style={styles.center}>
        <MaterialCommunityIcons name={icon} size={60} color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.m }} />
        <Text style={styles.statusText}>{message}</Text>
        {error && 
          <TouchableOpacity style={styles.button} onPress={onRefresh}>
            <Text style={styles.buttonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        }
    </View>
  );

  if (loading && !refreshing) {
    return <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }
  
  return (
    <View style={styles.container}>
      <FlatList
        data={feed}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} tintColor={theme.colors.primary} />}
        ListEmptyComponent={() => !loading && renderStatus(error ? 'alert-circle-outline' : 'compass-off-outline', error || 'Nenhum conteúdo no feed ainda.')}
      />

      {canCreate && <FAB onPress={() => setShowCreateOptions(true)} icon="plus" />}

      <Modal visible={showCreateOptions} transparent animationType="fade" onRequestClose={() => setShowCreateOptions(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowCreateOptions(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Criar Publicação</Text>
            {canCreateMomento && (
              <TouchableOpacity style={styles.modalButton} onPress={() => navigateToCreate('MomentCreate')}>
                <MaterialCommunityIcons name="image-multiple" size={24} color={theme.colors.primary} />
                <Text style={styles.modalButtonText}>Novo Momento</Text>
              </TouchableOpacity>
            )}
            {canCreateComunicado && (
              <TouchableOpacity style={styles.modalButton} onPress={() => navigateToCreate('ComunicadoCreate')}>
                <MaterialCommunityIcons name="bullhorn" size={24} color={theme.colors.primary} />
                <Text style={styles.modalButtonText}>Novo Comunicado</Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.l },
  statusText: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center' },
  button: { backgroundColor: theme.colors.primary, padding: theme.spacing.m, borderRadius: theme.shape.borderRadiusMedium, marginTop: theme.spacing.m },
  buttonText: { ...theme.typography.button },
  listContent: { padding: theme.spacing.m },
  card: { ...theme.components.card, marginBottom: theme.spacing.m, ...theme.shadows.light },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.m },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: theme.spacing.m, backgroundColor: theme.colors.border },
  autorNome: { ...theme.typography.label },
  data: { ...theme.typography.caption, color: theme.colors.textSecondary },
  imagem: { width: '100%', height: 250, borderRadius: theme.shape.borderRadiusSmall, marginVertical: theme.spacing.m },
  titulo: { ...theme.typography.h3, marginBottom: theme.spacing.s },
  conteudo: { ...theme.typography.body, color: theme.colors.textSecondary, lineHeight: 22 },
  cardFooter: { flexDirection: 'row', paddingTop: theme.spacing.m, borderTopWidth: 1, borderTopColor: theme.colors.border, marginTop: theme.spacing.m },
  acaoButton: { flexDirection: 'row', alignItems: 'center', marginRight: theme.spacing.l },
  acaoTexto: { ...theme.typography.caption, color: theme.colors.textSecondary, marginLeft: theme.spacing.xs },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.shape.borderRadiusLarge,
    padding: theme.spacing.l,
    width: '80%',
    ...theme.shadows.medium,
  },
  modalTitle: { ...theme.typography.h3, textAlign: 'center', marginBottom: theme.spacing.l, color: theme.colors.primary },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.m,
    borderRadius: theme.shape.borderRadiusMedium,
    backgroundColor: theme.colors.background,
    marginBottom: theme.spacing.m,
  },
  modalButtonText: { ...theme.typography.label, marginLeft: theme.spacing.m },
});

export default FeedScreen;

