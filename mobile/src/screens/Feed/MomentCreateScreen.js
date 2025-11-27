import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { feedService } from '../../services/feedService';
import { academicoService } from '../../services/academicoService';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MomentCreateScreen = () => {
  const [descricao, setDescricao] = useState('');
  const [image, setImage] = useState(null); // Alterado para um único objeto de imagem
  const [isPublishing, setIsPublishing] = useState(false);
  const [turmas, setTurmas] = useState([]);
  const [selectedTurma, setSelectedTurma] = useState(null);
  const [showTurmaModal, setShowTurmaModal] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const loadTurmas = async () => {
      try {
        const resp = await academicoService.getTurmas();
        setTurmas(resp.data.results || resp.data || []);
      } catch (err) {
        console.warn('Não foi possível carregar turmas:', err);
      }
    };
    loadTurmas();
  }, []);

  const pickImage = async () => {
    if (isPublishing) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Negada', 'Você precisa permitir o acesso à galeria para postar fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Permite edição para garantir um bom enquadramento
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const fileType = asset.uri.split('.').pop();
      setImage({
        uri: asset.uri,
        name: `photo_${Date.now()}.${fileType}`,
        type: `image/${fileType}`,
      });
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const handlePublish = async () => {
    if (!descricao.trim() && !image) {
      Alert.alert('Conteúdo Vazio', 'Adicione uma descrição ou uma imagem.');
      return;
    }
    
    setIsPublishing(true);
    try {
      const formData = new FormData();
      
      formData.append('descricao', descricao);
      formData.append('data_momento', new Date().toISOString().split('T')[0]);
      
      if (selectedTurma) {
        formData.append('turma_id', selectedTurma.id);
      }
      
      if (image) {
        formData.append('tipo', 'FOTO');
        // O objeto do arquivo deve ter uri, name e type
        formData.append('arquivo', {
          uri: image.uri,
          name: image.name,
          type: image.type,
        });
      }

      await feedService.criarMomentoFormData(formData);

      Alert.alert('Sucesso', 'Momento publicado!');
      navigation.goBack();
    } catch (error) {
      console.error(error.response?.data || error);
      Alert.alert('Erro', `Não foi possível publicar o momento: ${JSON.stringify(error.response?.data)}`);
    } finally {
      setIsPublishing(false);
    }
  };
  
  const selectedTurmaNome = selectedTurma ? selectedTurma.nome : 'Selecionar Turma (Opcional)';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.header}>Criar Novo Momento</Text>
      
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          value={descricao}
          onChangeText={setDescricao}
          placeholder="No que você está pensando?"
          multiline
        />

        <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
          <MaterialCommunityIcons name="image-plus" size={24} color={theme.colors.primary} />
          <Text style={styles.imagePickerButtonText}>Adicionar Foto</Text>
        </TouchableOpacity>

        {image && (
          <View style={styles.previewContainer}>
            <View style={styles.previewWrapper}>
              <Image source={{ uri: image.uri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                <MaterialCommunityIcons name="close-circle" size={24} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.card} onPress={() => setShowTurmaModal(true)}>
        <View style={styles.selectButton}>
          <MaterialCommunityIcons name="google-classroom" size={24} color={theme.colors.textSecondary} />
          <Text style={styles.selectButtonText}>{selectedTurmaNome}</Text>
          <MaterialCommunityIcons name="chevron-down" size={24} color={theme.colors.textSecondary} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.publishButton, isPublishing && styles.publishButtonDisabled]} onPress={handlePublish} disabled={isPublishing}>
        {isPublishing ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.publishButtonText}>Publicar</Text>}
      </TouchableOpacity>
      
      <Modal visible={showTurmaModal} transparent animationType="fade" onRequestClose={() => setShowTurmaModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowTurmaModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Escolha uma Turma</Text>
            <ScrollView>
              {turmas.map((t) => (
                <TouchableOpacity key={t.id} style={styles.modalItem} onPress={() => { setSelectedTurma(t); setShowTurmaModal(false); }}>
                  <Text style={styles.modalItemText}>{t.nome} ({t.ano_letivo})</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  contentContainer: { padding: theme.spacing.m },
  header: { ...theme.typography.h2, color: theme.colors.primary, marginBottom: theme.spacing.l, textAlign: 'center' },
  card: { ...theme.components.card, padding: theme.spacing.m, marginBottom: theme.spacing.m, ...theme.shadows.light },
  
  input: {
    minHeight: 120,
    textAlignVertical: 'top',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.shape.borderRadiusMedium,
    padding: theme.spacing.m,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textPrimary,
  },

  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.m,
    marginTop: theme.spacing.m,
    borderRadius: theme.shape.borderRadiusMedium,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  imagePickerButtonText: { ...theme.typography.link, marginLeft: theme.spacing.s },

  previewContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: theme.spacing.m },
  previewWrapper: { position: 'relative', marginRight: theme.spacing.s, marginBottom: theme.spacing.s },
  previewImage: { width: 100, height: 100, borderRadius: theme.shape.borderRadiusSmall },
  removeImageButton: { position: 'absolute', top: -8, right: -8, backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: 12 },
  
  selectButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  selectButtonText: { ...theme.typography.body, color: theme.colors.textSecondary, marginLeft: theme.spacing.m, flex: 1 },

  publishButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.shape.borderRadiusMedium,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  publishButtonDisabled: { opacity: 0.7 },
  publishButtonText: { ...theme.typography.button },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.shape.borderRadiusLarge,
    padding: theme.spacing.l,
    width: '90%',
    maxHeight: '70%',
    ...theme.shadows.medium,
  },
  modalTitle: { ...theme.typography.h3, textAlign: 'center', marginBottom: theme.spacing.l, color: theme.colors.primary },
  modalItem: { padding: theme.spacing.m, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  modalItemText: { ...theme.typography.body, textAlign: 'center' },
});

export default MomentCreateScreen;
