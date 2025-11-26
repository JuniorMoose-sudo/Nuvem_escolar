import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, FlatList } from 'react-native';
import { agendaService } from '../../services/agendaService';
import { academicoService } from '../../services/academicoService';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const PRESET_TYPES = ['Alimentação', 'Sono', 'Evacuação', 'Banho', 'Tarefa', 'Outro'];
const emptyActivity = () => ({ tipo: 'Alimentação', horario_h: '', horario_m: '', customTipo: '', observacao: '' });

const AgendaCreateScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedAluno, setSelectedAluno] = useState(null);
  const searchTimeout = useRef(null);

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [atividades, setAtividades] = useState([emptyActivity()]);
  const [observacoes, setObservacoes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  const addActivity = () => setAtividades(prev => [...prev, emptyActivity()]);
  const removeActivity = (index) => setAtividades(prev => prev.filter((_, i) => i !== index));
  const updateActivity = (index, key, value) => setAtividades(prev => prev.map((act, i) => i === index ? { ...act, [key]: value } : act));

  const validate = () => {
    if (!selectedAluno?.id) return 'Selecione um aluno da lista.';
    if (!date) return 'Informe a data da agenda.';
    if (atividades.length === 0) return 'Adicione pelo menos uma atividade.';
    for (const act of atividades) {
      const hh = String(act.horario_h || '').trim();
      const mm = String(act.horario_m || '').trim();
      const tipo = act.tipo === 'Outro' ? act.customTipo : act.tipo;
      if (!tipo.trim() || !/^[0-9]{1,2}$/.test(hh) || !/^[0-9]{1,2}$/.test(mm)) {
        return 'Preencha o tipo e o horário (HH:MM) de todas as atividades.';
      }
    }
    return null;
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSearch = useCallback(async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const resp = await academicoService.searchAlunos(query, 1);
      const items = resp.data?.results || resp.data || [];
      setSuggestions(Array.isArray(items) ? items : []);
    } catch (err) {
      console.warn('Erro buscando alunos:', err);
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    searchTimeout.current = setTimeout(() => handleSearch(searchQuery.trim()), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery, handleSearch]);

  const selectAluno = (aluno) => {
    setSelectedAluno(aluno);
    setSearchQuery('');
    setSuggestions([]);
  };

  const handlePublish = async () => {
    setError(null);
    const validationError = validate();
    if (validationError) return Alert.alert('Formulário Incompleto', validationError);

    setIsSubmitting(true);
    try {
      const formattedAtividades = atividades.map(a => ({
        tipo: a.tipo === 'Outro' ? a.customTipo : a.tipo,
        horario: `${String(a.horario_h).padStart(2, '0')}:${String(a.horario_m).padStart(2, '0')}`,
        observacao: a.observacao,
      }));

      const payload = {
        aluno_id: selectedAluno.id,
        data: date.toISOString().split('T')[0],
        atividades: formattedAtividades,
        observacoes_professor: observacoes,
      };

      await agendaService.criarAgenda(payload);
      Alert.alert('Sucesso', 'Agenda diária criada com sucesso!');
      navigation.goBack();
    } catch (err) {
      console.error('Erro ao criar agenda:', err.response?.data || err);
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : 'Não foi possível criar a agenda.';
      setError(errorMsg);
      Alert.alert('Erro', errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.header}>Criar Nova Agenda Diária</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Aluno</Text>
        {selectedAluno ? (
          <View style={styles.selectedItem}>
            <Text style={styles.selectedItemText}>{selectedAluno.nome_completo}</Text>
            <TouchableOpacity onPress={() => setSelectedAluno(null)}>
              <MaterialCommunityIcons name="close-circle" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TextInput style={styles.input} value={searchQuery} onChangeText={setSearchQuery} placeholder="Buscar por nome ou matrícula..." />
            {searching && <ActivityIndicator size="small" color={theme.colors.primary} />}
            {suggestions.length > 0 && (
              <FlatList
                data={suggestions}
                keyExtractor={(item) => String(item.id)}
                style={styles.suggestionsList}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => selectAluno(item)} style={styles.suggestionItem}>
                    <Text>{item.nome_completo}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </>
        )}
      </View>
      
      <View style={styles.card}>
        <Text style={styles.label}>Data da Agenda</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text>{date.toLocaleDateString('pt-BR')}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Atividades</Text>
        {atividades.map((act, idx) => (
          <View key={idx} style={styles.activityRow}>
            <View style={styles.activityHeader}>
              <Text style={styles.activityTitle}>Atividade #{idx + 1}</Text>
              <TouchableOpacity onPress={() => removeActivity(idx)}>
                <MaterialCommunityIcons name="delete-outline" size={24} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.pickerContainer}>
              {PRESET_TYPES.map(type => (
                <TouchableOpacity key={type} style={[styles.chip, act.tipo === type && styles.chipSelected]} onPress={() => updateActivity(idx, 'tipo', type)}>
                  <Text style={[styles.chipText, act.tipo === type && styles.chipTextSelected]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {act.tipo === 'Outro' && (
              <TextInput style={styles.input} value={act.customTipo} onChangeText={v => updateActivity(idx, 'customTipo', v)} placeholder="Especifique o tipo" />
            )}

            <View style={styles.timeContainer}>
              <TextInput style={[styles.input, styles.timeInput]} value={act.horario_h} onChangeText={v => updateActivity(idx, 'horario_h', v.replace(/[^0-9]/g, ''))} placeholder="HH" keyboardType="numeric" maxLength={2} />
              <Text style={styles.timeSeparator}>:</Text>
              <TextInput style={[styles.input, styles.timeInput]} value={act.horario_m} onChangeText={v => updateActivity(idx, 'horario_m', v.replace(/[^0-9]/g, ''))} placeholder="MM" keyboardType="numeric" maxLength={2} />
            </View>
            
            <TextInput style={styles.input} value={act.observacao} onChangeText={v => updateActivity(idx, 'observacao', v)} placeholder="Observação (opcional)" multiline />
          </View>
        ))}
        <TouchableOpacity style={styles.addButton} onPress={addActivity}>
          <MaterialCommunityIcons name="plus-circle-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.addButtonText}>Adicionar Atividade</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Observações Gerais do Professor</Text>
        <TextInput style={[styles.input, { height: 100 }]} value={observacoes} onChangeText={setObservacoes} placeholder="Comentários sobre o dia do aluno..." multiline />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} onPress={handlePublish} disabled={isSubmitting}>
        {isSubmitting ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.submitButtonText}>Criar Agenda</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  contentContainer: { padding: theme.spacing.m },
  header: { ...theme.typography.h2, color: theme.colors.primary, marginBottom: theme.spacing.l, textAlign: 'center' },
  card: { ...theme.components.card, padding: theme.spacing.m, marginBottom: theme.spacing.m, ...theme.shadows.light },
  label: { ...theme.typography.label, marginBottom: theme.spacing.s, color: theme.colors.primary },
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
  selectedItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...theme.components.card, padding: theme.spacing.m, backgroundColor: theme.colors.background },
  selectedItemText: { ...theme.typography.body, fontWeight: 'bold' },
  suggestionsList: { maxHeight: 200, borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.shape.borderRadiusSmall },
  suggestionItem: { padding: theme.spacing.m, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  
  activityRow: {
    padding: theme.spacing.m,
    backgroundColor: theme.colors.background,
    borderRadius: theme.shape.borderRadiusSmall,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.m },
  activityTitle: { ...theme.typography.label },
  
  pickerContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: theme.spacing.s },
  chip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.s,
    borderRadius: theme.shape.borderRadiusLarge,
    backgroundColor: theme.colors.border,
    margin: theme.spacing.xs,
  },
  chipSelected: { backgroundColor: theme.colors.primary },
  chipText: { ...theme.typography.caption, color: theme.colors.textSecondary },
  chipTextSelected: { color: theme.colors.white },
  
  timeContainer: { flexDirection: 'row', alignItems: 'center' },
  timeInput: { width: 70, textAlign: 'center' },
  timeSeparator: { ...theme.typography.h2, marginHorizontal: theme.spacing.s },
  
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: theme.spacing.s, marginTop: theme.spacing.s },
  addButtonText: { ...theme.typography.link, marginLeft: theme.spacing.s },
  
  submitButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.m,
    borderRadius: theme.shape.borderRadiusMedium,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { ...theme.typography.button },
  errorText: { color: theme.colors.error, textAlign: 'center', marginBottom: theme.spacing.m },
});

export default AgendaCreateScreen;
