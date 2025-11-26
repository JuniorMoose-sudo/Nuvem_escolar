import React, { useEffect, useRef } from 'react';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { navigate } from './src/navigation/navigationService';

// Trata notificações recebidas enquanto o app está em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Listener para notificações recebidas em foreground
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      // Você pode atualizar estado local, exibir UI custom ou analytics aqui
      console.log('Notificação recebida (foreground):', notification);
    });

    // Listener para quando o usuário interage com a notificação
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Interação com notificação:', response);
      // Se payload tiver dados de navegação, usa navigation service
      try {
        const data = response?.notification?.request?.content?.data;
        if (data && data.screen) {
          navigate(data.screen, data.params || {});
        }
      } catch (err) {
        console.log('Erro ao navegar pela notificação:', err);
      }
    });

    return () => {
      if (notificationListener.current) Notifications.removeNotificationSubscription(notificationListener.current);
      if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
