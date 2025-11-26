import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../theme/theme';

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
      
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      const userResponse = await api.get('/usuarios/me/');
      
      await login(access, refresh, userResponse.data);
      
      navigation.replace('Feed');
    } catch (error) {
      console.error('Erro no login:', error);
      
      let errorMessage = 'Erro ao fazer login.';
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        errorMessage = 'Não foi possível conectar ao servidor.';
      } else if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          errorMessage = 'E-mail ou senha inválidos.';
        } else {
          errorMessage = 'Ocorreu um erro ao tentar fazer login.';
        }
      }
      
      Alert.alert('Erro no Login', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.contentWrapper}>
        <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>NE</Text>
        </View>

        <Text style={styles.title}>Nuvem Escolar</Text>
        
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          placeholderTextColor={theme.colors.placeholder}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          placeholderTextColor={theme.colors.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotPasswordContainer}>
          <Text style={styles.forgotPasswordText}>
            Esqueceu a senha?
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.l,
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  logoPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  input: {
    width: '100%',
    height: 54, // Altura fixa para consistência
    backgroundColor: theme.colors.card,
    borderRadius: theme.shape.borderRadiusMedium,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.m,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.m,
    ...theme.shadows.light,
  },
  button: {
    width: '100%',
    height: 52,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.shape.borderRadiusMedium,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.s,
    ...theme.shadows.medium,
  },
  buttonText: {
    ...theme.typography.button,
  },
  forgotPasswordContainer: {
    marginTop: theme.spacing.l,
  },
  forgotPasswordText: {
    ...theme.typography.link,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
