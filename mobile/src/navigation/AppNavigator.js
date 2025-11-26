import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { navigationRef } from './navigationService';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Ícones mais modernos
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme/theme'; // Nosso novo tema centralizado

// Telas
import PerfilScreen from '../screens/PerfilScreen';
import LoginScreen from '../screens/LoginScreen';
import AgendaListScreen from '../screens/Agenda/AgendaListScreen';
import AgendaDetalheScreen from '../screens/Agenda/AgendaDetalheScreen';
import AgendaCreateScreen from '../screens/Agenda/AgendaCreateScreen';
import AlunosListScreen from '../screens/Academico/AlunosListScreen';
import TurmasListScreen from '../screens/Academico/TurmasListScreen';
import MateriasListScreen from '../screens/Academico/MateriasListScreen';
import FeedScreen from '../screens/Feed/FeedScreen';
import MomentCreateScreen from '../screens/Feed/MomentCreateScreen';
import ComunicadoCreateScreen from '../screens/Feed/ComunicadoCreateScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Mapeamento de ícones para um código mais limpo e melhor UX (ativo/inativo)
const tabIcons = {
  Feed: { active: 'home-variant', inactive: 'home-variant-outline' },
  Agenda: { active: 'calendar-month', inactive: 'calendar-month-outline' },
  Alunos: { active: 'account-group', inactive: 'account-group-outline' },
  Matérias: { active: 'book-open-variant', inactive: 'book-open-outline' },
  Perfil: { active: 'account-circle', inactive: 'account-circle-outline' },
};

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Stacks com header themificado
  const ThemedStackNavigator = ({ name, component, options, title }) => (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.header },
        headerTintColor: theme.colors.headerText,
        headerTitleStyle: { ...theme.typography.h3, fontSize: 20 },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name={name} component={component} options={{ title: title, ...options }} />
    </Stack.Navigator>
  );

  const AgendaStackScreen = () => (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.header },
        headerTintColor: theme.colors.headerText,
        headerTitleStyle: { ...theme.typography.h3, fontSize: 20 },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name="AgendaList" component={AgendaListScreen} options={{ title: 'Agendas Diárias' }} />
      <Stack.Screen name="AgendaCreate" component={AgendaCreateScreen} options={{ title: 'Nova Agenda' }} />
      <Stack.Screen name="AgendaDetalhe" component={AgendaDetalheScreen} options={{ title: 'Detalhes da Agenda' }} />
    </Stack.Navigator>
  );

  const FeedStackScreen = () => (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.header },
        headerTintColor: theme.colors.headerText,
        headerTitleStyle: { ...theme.typography.h3, fontSize: 20 },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name="FeedList" component={FeedScreen} options={{ title: 'Feed' }} />
      <Stack.Screen name="MomentCreate" component={MomentCreateScreen} options={{ title: 'Novo Momento' }} />
      <Stack.Screen name="ComunicadoCreate" component={ComunicadoCreateScreen} options={{ title: 'Novo Comunicado' }} />
    </Stack.Navigator>
  );

  const MainTabs = () => {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          // Header geral para todas as abas
          headerStyle: { backgroundColor: theme.colors.header },
          headerTintColor: theme.colors.headerText,
          headerTitleStyle: { ...theme.typography.h3, fontSize: 20 },
          headerTitleAlign: 'center',

          // Estilos da Tab Bar
          tabBarActiveTintColor: theme.colors.tabBarActive,
          tabBarInactiveTintColor: theme.colors.tabBarInactive,
          tabBarLabelStyle: { ...theme.typography.caption, fontWeight: '600', fontSize: 12 },
          tabBarStyle: {
            height: 70,
            paddingTop: theme.spacing.s,
            paddingBottom: theme.spacing.s,
            backgroundColor: theme.colors.card,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          },
          
          // Ícone dinâmico baseado no estado (focado/não focado)
          tabBarIcon: ({ focused, color, size }) => {
            const iconSet = tabIcons[route.name];
            const iconName = focused ? iconSet.active : iconSet.inactive;
            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Feed" component={FeedStackScreen} options={{ headerShown: false, title: 'Feed' }} />
        <Tab.Screen name="Agenda" component={AgendaStackScreen} options={{ headerShown: false, title: 'Agenda' }} />
        <Tab.Screen name="Alunos" component={AlunosListScreen} options={{ title: 'Alunos' }} />
        <Tab.Screen name="Matérias" component={MateriasListScreen} options={{ title: 'Matérias' }} />
        <Tab.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Meu Perfil' }} />
      </Tab.Navigator>
    );
  };

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background, // Usando cor do tema
  },
});

export default AppNavigator;
