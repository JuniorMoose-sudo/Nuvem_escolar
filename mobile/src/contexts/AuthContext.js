import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSignout, setIsSignout] = useState(false);

  useEffect(() => {
    // Verifica se o usuário já está logado ao iniciar o app
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUserToken(token);
        }
      } catch (e) {
        console.error("Erro ao restaurar token:", e);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const authContext = {
    signIn: async (email, password) => {
      setIsLoading(true);
      try {
        // O backend espera 'email', não 'username'
        const response = await api.post('/usuarios/token/', {
          email,
          password,
        });
        const { access, refresh } = response.data;
        
        await AsyncStorage.setItem('accessToken', access);
        await AsyncStorage.setItem('refreshToken', refresh);
        
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        setUserToken(access);
      } catch (error) {
        console.error('Erro no signIn:', error.response?.data || error.message);
        // Propaga o erro para a tela de Login poder exibi-lo
        throw new Error(error.response?.data?.detail || 'Falha no login');
      } finally {
        setIsLoading(false);
      }
    },
    signOut: async () => {
      setIsSignout(true);
      try {
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        delete api.defaults.headers.common['Authorization'];
        setUserToken(null);
      } catch (e) {
        console.error("Erro no signOut:", e);
      } finally {
        setIsSignout(false);
      }
    },
    userToken,
    isLoading,
    isSignout,
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
