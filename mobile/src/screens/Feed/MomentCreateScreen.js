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
import uploadService from '../../services/uploadService';
import { feedService } from '../../services/feedService';
import { academicoService } from '../../services/academicoService';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const MomentCreateScreen = () => {
  const [descricao, setDescricao] = useState('');
  const [images, setImages] = useState([]);
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

  const pickImages = async () => {
    if (isPublishing) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.cancelled) {
      const newImages = result.selected 
        ? result.selected.map((r, idx) => ({ uri: r.uri, name: `photo_${Date.now()}_${idx}.jpg`, type: 'image/jpeg' }))
        : [{ uri: result.uri, name: `photo_${Date.now()}.jpg`, type: 'image/jpeg' }];
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async () => {
    if (!descricao.trim() && images.length === 0) {
      Alert.alert('Conteúdo Vazio', 'Adicione uma descrição ou pelo menos uma imagem.');
      return;
    }
    
    setIsPublishing(true);
    try {
      let fileKeys = [];
      if (images.length > 0) {
        try {
          fileKeys = await uploadService.presignAndUpload(images);
        } catch (err) {
          console.warn('Presign falhou, usando fallback de upload via backend.', err);
          // O backend irá lidar com o upload multipart se file_keys não for enviado
        }
      }

      const payload = {
        descricao,
        data_momento: new Date().toISOString().split('T')[0],
        ...(selectedTurma && { turma_id: selectedTurma.id }),
        ...(fileKeys.length > 0 && { file_keys: fileKeys }),
      };

      if (fileKeys.length > 0) {
        await feedService.criarMomento(payload);
      } else {
        const formData = new FormData();
        Object.keys(payload).forEach(key => formData.append(key, payload[key]));
        images.forEach(img => {
          formData.append('arquivo', { uri: img.uri, name: img.name, type: img.type });
        });
        await feedService.criarMomentoFormData(formData);
      }

      Alert.alert('Sucesso', 'Momento publicado!');
      navigation.goBack();
    } catch (error) {
      console.error(error.response?.data || error);
      Alert.alert('Erro', 'Não foi possível publicar o momento.');
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

        <TouchableOpacity style={styles.imagePickerButton} onPress={pickImages}>
          <MaterialCommunityIcons name="image-plus" size={24} color={theme.colors.primary} />
          <Text style={styles.imagePickerButtonText}>Adicionar Fotos</Text>
        </TouchableOpacity>

        <View style={styles.previewContainer}>
          {images.map((img, idx) => (
            <View key={idx} style={styles.previewWrapper}>
              <Image source={{ uri: img.uri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.removeImageButton} onPress={() => removeImage(idx)}>
                <MaterialCommunityIcons name="close-circle" size={24} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
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
  previewImage: { width: 80, height: 80, borderRadius: theme.shape.borderRadiusSmall },
  removeImageButton: { position: 'absolute', top: -8, right: -8, backgroundColor: theme.colors.card, borderRadius: 12 },
  
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
