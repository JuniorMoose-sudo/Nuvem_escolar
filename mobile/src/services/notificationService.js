import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import api from './api';

/**
 * Request permission and get device push token.
 * Tries to get the native device token (FCM/APNs). Falls back to Expo push token.
 */
export async function registerForPushNotificationsAsync() {
  try {
    if (!Device.isDevice) {
      console.warn('Push notifications must use a physical device.');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Permissão de notificações negada');
      return null;
    }

    // Tenta obter o token nativo do dispositivo (FCM para Android, APNs para iOS)
    let deviceToken = null;
    try {
      const tokenData = await Notifications.getDevicePushTokenAsync();
      if (tokenData && tokenData.data) {
        // tokenData: { type: 'fcm'|'apns', data: '...' }
        deviceToken = tokenData.data;
      }
    } catch (err) {
      console.warn('getDevicePushTokenAsync não disponível:', err.message || err);
    }

    // Se não obteve token nativo, usa o Expo push token
    if (!deviceToken) {
      try {
        const expoToken = await Notifications.getExpoPushTokenAsync();
        deviceToken = expoToken.data;
      } catch (err) {
        console.error('Não foi possível obter Expo push token:', err);
        return null;
      }
    }

    return deviceToken;
  } catch (err) {
    console.error('Erro ao registrar notificações:', err);
    return null;
  }
}

export async function sendTokenToBackend(token, plataforma = 'FCM') {
  if (!token) return null;
  try {
    // O endpoint precisa existir: POST /api/v1/usuarios/push-tokens/
    const payload = { token, plataforma };
    const response = await api.post('/usuarios/push-tokens/', payload);
    return response.data;
  } catch (err) {
    console.error('Erro ao enviar token ao backend:', err.response ? err.response.data : err.message);
    return null;
  }
}

export default {
  registerForPushNotificationsAsync,
  sendTokenToBackend,
};
