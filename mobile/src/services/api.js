import AsyncStorage from '@react-native-async-storage/async-storage'; // Necessário instalar esta lib

import axios from 'axios';

// Altere para o IP da sua máquina ou URL do backend em produção
const API_URL = 'http://192.168.0.103:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken'); // Supondo que o token é salvo aqui
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// TODO: Adicionar interceptor para lidar com refresh token e logout em caso de 401/403

export default api;
