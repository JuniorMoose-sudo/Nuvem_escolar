import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';

// Telas de Autenticação
import LoginScreen from '../screens/LoginScreen';

// Telas de Agenda
import AgendaListScreen from '../screens/Agenda/AgendaListScreen';
import AgendaDetalheScreen from '../screens/Agenda/AgendaDetalheScreen';

// Telas Acadêmicas (Sprint 2)
import AlunosListScreen from '../screens/Academico/AlunosListScreen';
import TurmasListScreen from '../screens/Academico/TurmasListScreen';
import MateriasListScreen from '../screens/Academico/MateriasListScreen';

// Telas de Feed (Sprint 4)
import FeedScreen from '../screens/Feed/FeedScreen';

const Stack = createNativeStackNavigator();

// Cores da paleta do projeto
const COLORS = {
  azulClaro: '#4A90E2',
  branco: '#FFFFFF',
};

const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Durante o carregamento, mostra um loading
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.azulClaro} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.azulClaro,
          },
          headerTintColor: COLORS.branco,
          headerTitleStyle: {
            fontWeight: 'bold',
            // fontFamily: 'Nunito-Bold', // Adicionar após configurar fontes
          },
          headerTitleAlign: 'center',
        }}
      >
        {!isAuthenticated ? (
          // Stack de Autenticação
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ 
              title: 'Nuvem Escolar',
              headerShown: false, // LoginScreen tem seu próprio header
            }} 
          />
        ) : (
          // Stack Principal (após login)
          <>
            {/* Tela de Feed (Sprint 4) - Tela inicial após login */}
            <Stack.Screen 
              name="Feed" 
              component={FeedScreen} 
              options={{ title: 'Feed' }} 
            />
            
            {/* Telas Acadêmicas (Sprint 2) */}
            <Stack.Screen 
              name="AlunosList" 
              component={AlunosListScreen} 
              options={{ title: 'Alunos' }} 
            />
            <Stack.Screen 
              name="TurmasList" 
              component={TurmasListScreen} 
              options={{ title: 'Turmas' }} 
            />
            <Stack.Screen 
              name="MateriasList" 
              component={MateriasListScreen} 
              options={{ title: 'Matérias' }} 
            />
            
            {/* Telas de Agenda */}
            <Stack.Screen 
              name="AgendaList" 
              component={AgendaListScreen} 
              options={{ title: 'Agendas Diárias' }} 
            />
            <Stack.Screen 
              name="AgendaDetalhe" 
              component={AgendaDetalheScreen} 
              options={{ title: 'Detalhes da Agenda' }} 
            />
          </>
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
    backgroundColor: COLORS.branco,
  },
});

export default AppNavigator;
