import { Platform } from 'react-native';

const palette = {
  // Azul primário (Nuvem Escolar)
  primary: '#2A628F',
  
  // Cores de Fundo
  background: '#F9FAFB', // Fundo principal super claro
  card: '#FFFFFF', // Fundo de cards, inputs, etc.
  
  // Cores de Texto
  textPrimary: '#1F2937', // Quase preto para títulos e textos principais
  textSecondary: '#6B7280', // Cinza para textos de apoio e legendas
  textLight: '#FFFFFF', // Texto sobre fundos escuros/primários

  // Cores Neutras e de Interface
  border: '#E5E7EB', // Bordas de inputs e divisores
  placeholder: '#A0A0A0', // Cor para placeholders de inputs
  
  // Cores de Feedback Semântico
  error: '#EF4444', // Vermelho para erros
  success: '#22C55E', // Verde para sucesso
  warning: '#F59E0B', // Amarelo para avisos
  info: '#3B82F6', // Azul para informações
  
  // Cores Constantes
  white: '#FFFFFF',
  black: '#000000',
};

export const theme = {
  colors: {
    ...palette,
    // Mapeamento semântico adicional
    header: palette.primary,
    headerText: palette.white,
    tabBarActive: palette.primary,
    tabBarInactive: palette.textSecondary,
  },
  spacing: {
    xs: 4,
    s: 8,
    m: 16, // Espaçamento padrão
    l: 24,
    xl: 32,
    xxl: 40,
  },
  typography: {
    // Títulos
    h1: {
      fontSize: 30,
      fontWeight: '800',
      color: palette.textPrimary,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700',
      color: palette.textPrimary,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      color: palette.textPrimary,
    },
    // Corpo de Texto
    body: {
      fontSize: 16,
      fontWeight: '400',
      color: palette.textPrimary,
    },
    bodySecondary: {
      fontSize: 16,
      fontWeight: '400',
      color: palette.textSecondary,
    },
    // Outros
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: palette.textPrimary,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400',
      color: palette.textSecondary,
    },
    link: {
      fontSize: 14,
      fontWeight: '600',
      color: palette.primary,
    },
    button: {
      fontSize: 18,
      fontWeight: 'bold',
      color: palette.textLight,
    },
  },
  shape: {
    borderRadiusSmall: 8,
    borderRadiusMedium: 14, // Padrão para inputs, botões e cards
    borderRadiusLarge: 20,
  },
  shadows: {
    light: {
      ...Platform.select({
        ios: {
          shadowColor: palette.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    medium: {
      ...Platform.select({
        ios: {
          shadowColor: palette.black,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
        },
        android: {
          elevation: 5,
        },
      }),
    },
  },
  // Estilos de componentes globais
  components: {
    container: {
      flex: 1,
      backgroundColor: palette.background,
      padding: 16,
    },
    card: {
      backgroundColor: palette.card,
      borderRadius: 14,
      padding: 16,
    }
  }
};
