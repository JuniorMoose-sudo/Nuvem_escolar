import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { feedService } from '../../services/feedService';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ComunicadoCreateScreen = () => {
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  const handlePublish = async () => {
    setError(null);
    if (!titulo.trim() || !conteudo.trim()) {
      return Alert.alert('Campos Obrigatórios', 'Por favor, preencha o título e o conteúdo.');
    }

    setIsSubmitting(true);
    try {
      await feedService.criarComunicado({ titulo, conteudo });
      Alert.alert('Sucesso', 'Comunicado publicado!');
      navigation.goBack();
    } catch (err) {
      console.error('Erro ao publicar comunicado:', err.response?.data || err);
      const msg = err.response?.data?.detail || 'Não foi possível publicar o comunicado.';
      setError(msg);
      Alert.alert('Erro', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.header}>Criar Novo Comunicado</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Assunto principal do comunicado"
        />

        <Text style={styles.label}>Conteúdo</Text>
        <TextInput
          style={[styles.input, { height: 200, textAlignVertical: 'top' }]}
          value={conteudo}
          onChangeText={setConteudo}
          placeholder="Escreva a mensagem completa aqui..."
          multiline
        />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity style={[styles.publishButton, isSubmitting && styles.publishButtonDisabled]} onPress={handlePublish} disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color={theme.colors.white} />
        ) : (
          <Text style={styles.publishButtonText}>Publicar Comunicado</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: theme.spacing.m,
  },
  header: {
    ...theme.typography.h2,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.l,
  },
  card: {
    ...theme.components.card,
    padding: theme.spacing.m,
    ...theme.shadows.light,
    marginBottom: theme.spacing.l,
  },
  label: {
    ...theme.typography.label,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.s,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.shape.borderRadiusMedium,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.m,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: theme.spacing.m,
    borderRadius: theme.shape.borderRadiusMedium,
    marginBottom: theme.spacing.l,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    marginLeft: theme.spacing.s,
    flex: 1,
  },
  publishButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.shape.borderRadiusMedium,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  publishButtonDisabled: {
    opacity: 0.7,
  },
  publishButtonText: {
    ...theme.typography.button,
  },
});

export default ComunicadoCreateScreen;
