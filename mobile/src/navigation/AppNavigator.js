import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AgendaListScreen from '../screens/Agenda/AgendaListScreen';
import AgendaDetalheScreen from '../screens/Agenda/AgendaDetalheScreen';

const Stack = createNativeStackNavigator();

// Cores da paleta do projeto
const COLORS = {
  azulClaro: '#4A90E2',
  branco: '#FFFFFF',
};

const AppNavigator = () => {
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
