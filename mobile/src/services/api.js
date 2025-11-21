import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Altere para o IP da sua máquina ou URL do backend em produção
// IP detectado: 192.168.1.66
const API_URL = 'http://192.168.1.66:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de requisição: adiciona token automaticamente
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de resposta: trata refresh token e erros 401/403
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Se receber 401 e ainda não tentou refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Tenta obter novo access token
        const response = await axios.post(
          `${API_URL}/usuarios/token/refresh/`,
          { refresh: refreshToken }
        );

        const { access } = response.data;
        await AsyncStorage.setItem('accessToken', access);

        // Atualiza o header e repete a requisição original
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Se falhar o refresh, limpa tokens e redireciona para login
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        // Nota: O redirecionamento para login deve ser feito no componente
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
