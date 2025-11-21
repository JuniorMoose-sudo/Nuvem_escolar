import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { feedService } from '../../services/feedService';
import { useAuth } from '../../contexts/AuthContext';

const COLORS = {
  azulClaro: '#4A90E2',
  laranja: '#F5A623',
  branco: '#FFFFFF',
  cinzaClaro: '#9B9B9B',
};

const FeedScreen = () => {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState(null);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      // Carrega momentos e comunicados em paralelo
      const [momentosRes, comunicadosRes] = await Promise.all([
        feedService.getMomentos(page),
        feedService.getComunicados(page),
      ]);

      const momentos = momentosRes.data.results || [];
      const comunicados = comunicadosRes.data.results || [];

      // Combina e ordena por data (mais recente primeiro)
      const combined = [...momentos, ...comunicados].sort((a, b) => {
        const dateA = new Date(a.data_criacao || a.data_publicacao);
        const dateB = new Date(b.data_criacao || b.data_publicacao);
        return dateB - dateA;
      });

      if (append) {
        setFeed((prev) => [...prev, ...combined]);
      } else {
        setFeed(combined);
      }

      // Verifica se há próxima página
      const nextMomento = momentosRes.data.next;
      const nextComunicado = comunicadosRes.data.next;
      setNextPage(nextMomento || nextComunicado ? page + 1 : null);
    } catch (err) {
      setError('Erro ao carregar feed. Tente novamente.');
      console.error('Erro ao carregar feed:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFeed(1, false);
  };

  const loadMore = () => {
    if (nextPage && !loadingMore) {
      loadFeed(nextPage, true);
    }
  };

  const handleCurtir = async (item) => {
    try {
      if (item.tipo) {
        // É um momento
        await feedService.curtirMomento(item.id);
      } else {
        // É um comunicado
        await feedService.curtirComunicado(item.id);
      }
      // Recarrega o item específico
      loadFeed(1, false);
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível curtir. Tente novamente.');
    }
  };

  const renderItem = ({ item }) => {
    const isMomento = !!item.tipo;
    
    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.autor?.nome_completo?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.autorNome}>{item.autor?.nome_completo || 'Desconhecido'}</Text>
            <Text style={styles.data}>
              {new Date(item.data_criacao || item.data_publicacao).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>

        {/* Conteúdo */}
        {isMomento ? (
          <>
            {item.arquivo_url && (
              <Image source={{ uri: item.arquivo_url }} style={styles.imagem} />
            )}
            {item.descricao && (
              <Text style={styles.descricao}>{item.descricao}</Text>
            )}
          </>
        ) : (
          <>
            <Text style={styles.titulo}>{item.titulo}</Text>
            <Text style={styles.conteudo}>{item.conteudo}</Text>
          </>
        )}

        {/* Ações */}
        <View style={styles.acoes}>
          <TouchableOpacity
            style={styles.acaoButton}
            onPress={() => handleCurtir(item)}
          >
            <Text style={styles.acaoIcon}>❤️</Text>
            <Text style={styles.acaoTexto}>{item.total_curtidas || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acaoButton}>
            <Text style={styles.acaoIcon}>💬</Text>
            <Text style={styles.acaoTexto}>{item.total_comentarios || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.azulClaro} />
        <Text style={styles.loadingText}>Carregando feed...</Text>
      </View>
    );
  }

  if (error && !loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadFeed(1, false)}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={feed}
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
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator size="small" color={COLORS.azulClaro} style={styles.footerLoader} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhum conteúdo no feed ainda.</Text>
          </View>
        }
      />
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
  card: {
    backgroundColor: COLORS.branco,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.azulClaro,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.branco,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  autorNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  data: {
    fontSize: 12,
    color: COLORS.cinzaClaro,
    marginTop: 2,
  },
  imagem: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: 'cover',
  },
  descricao: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  titulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.azulClaro,
    marginBottom: 8,
  },
  conteudo: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    lineHeight: 20,
  },
  acoes: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 12,
  },
  acaoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  acaoIcon: {
    fontSize: 20,
    marginRight: 6,
  },
  acaoTexto: {
    fontSize: 14,
    color: COLORS.cinzaClaro,
  },
  footerLoader: {
    marginVertical: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.cinzaClaro,
    textAlign: 'center',
  },
});

export default FeedScreen;

