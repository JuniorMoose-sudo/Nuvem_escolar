import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const COLORS = {
  azulClaro: '#4A90E2',
  branco: '#FFFFFF',
  cinzaClaro: '#9B9B9B',
};

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/usuarios/token/', {
        email: email.trim(),
        password,
      });
      const { access, refresh } = response.data;
      
      // Busca dados do usuário para armazenar no contexto
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      const userResponse = await api.get('/usuarios/me/');
      
      // Faz login usando o contexto
      await login(access, refresh, userResponse.data);
      
      // Navega para o Feed após login
      navigation.replace('Feed');
    } catch (error) {
      console.error('Erro no login:', error);
      
      let errorMessage = 'Erro ao fazer login.';
      
      // Trata diferentes tipos de erro
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando e acessível.';
      } else if (error.response) {
        // Erro com resposta do servidor
        const status = error.response.status;
        if (status === 401) {
          errorMessage = error.response?.data?.detail || 
                        error.response?.data?.message ||
                        'E-mail ou senha inválidos.';
        } else if (status === 400) {
          errorMessage = error.response?.data?.detail || 
                        error.response?.data?.email?.[0] ||
                        error.response?.data?.password?.[0] ||
                        'Dados inválidos. Verifique os campos.';
        } else if (status >= 500) {
          errorMessage = 'Erro no servidor. Tente novamente mais tarde.';
        } else {
          errorMessage = error.response?.data?.detail || 
                        error.response?.data?.error || 
                        'Erro ao fazer login.';
        }
      } else if (error.request) {
        // Requisição foi feita mas não houve resposta
        errorMessage = 'Sem resposta do servidor. Verifique sua conexão.';
      }
      
      Alert.alert('Erro no Login', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nuvem Escolar</Text>
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.azulClaro} style={styles.loader} />
      ) : (
        <Button title="Entrar" onPress={handleLogin} color={COLORS.azulClaro} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#4A90E2',
  },
  input: {
    height: 40,
    borderColor: COLORS.cinzaClaro,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  loader: {
    marginTop: 10,
  },
});

export default LoginScreen;
