import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme/theme'; // Importando o tema
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PerfilScreen = () => {
  const { user, logout } = useAuth();

  // Dados mock para um usuário mais completo, para fins de UI
  const displayUser = {
    nome_completo: user?.nome_completo || user?.nome || 'Alex Green',
    tipo_usuario: user?.tipo_usuario || 'Responsável',
    email: user?.email || 'alex.green@example.com',
    avatar_url: user?.avatar_url,
    escola: {
      nome_fantasia: user?.escola?.nome_fantasia || 'Escola Padrão',
    },
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {displayUser.avatar_url ? (
            <Image source={{ uri: displayUser.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarLetter}>
                {displayUser.nome_completo.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{displayUser.nome_completo}</Text>
          <Text style={styles.role}>{displayUser.tipo_usuario.replace('_', ' ')}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Minhas Informações</Text>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="email-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.itemText}>{displayUser.email}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="school-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.itemText}>{displayUser.escola.nome_fantasia}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Configurações</Text>
        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingButtonText}>Notificações</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.grey2} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingButton}>
          <Text style={styles.settingButtonText}>Segurança</Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.grey2} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <MaterialCommunityIcons name="logout" size={20} color={theme.colors.white} />
        <Text style={styles.logoutText}>Sair da Conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.l,
    paddingBottom: theme.spacing.xl,
    alignItems: 'center',
    borderBottomLeftRadius: theme.shape.borderRadius * 2,
    borderBottomRightRadius: theme.shape.borderRadius * 2,
  },
  avatarContainer: {
    marginBottom: theme.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: theme.colors.white,
    ...theme.typography.h1,
    fontSize: 40,
  },
  info: {
    alignItems: 'center',
  },
  name: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  role: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
    marginTop: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.shape.borderRadius,
    marginHorizontal: theme.spacing.m,
    marginTop: theme.spacing.l,
    padding: theme.spacing.m,
  },
  cardTitle: {
    ...theme.typography.h3,
    fontSize: 18,
    marginBottom: theme.spacing.m,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  itemText: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginLeft: theme.spacing.m,
  },
  settingButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingButtonText: {
    ...theme.typography.body,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    margin: theme.spacing.m,
    padding: theme.spacing.m,
    borderRadius: theme.shape.borderRadius,
    marginTop: theme.spacing.l,
  },
  logoutText: {
    ...theme.typography.button,
    color: theme.colors.white,
    marginLeft: theme.spacing.s,
  },
});

export default PerfilScreen;
