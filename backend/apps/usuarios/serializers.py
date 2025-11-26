from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from .models import Usuario, PushToken
from apps.core.models import Escola

class EscolaTokenSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para incluir dados da escola no token.
    """
    class Meta:
        model = Escola
        fields = ['id', 'nome_fantasia']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Customiza o serializer do SimpleJWT para adicionar informações
    adicionais (payload) ao access token e melhorar mensagens de erro.
    """
    default_error_messages = {
        "no_active_account": "Nenhuma conta ativa encontrada com as credenciais fornecidas"
    }
    
    def validate(self, attrs):
        """
        Valida as credenciais e retorna os tokens.
        Melhora as mensagens de erro em português.
        """
        try:
            data = super().validate(attrs)
        except AuthenticationFailed as e:
            # Melhora a mensagem de erro para português
            raise AuthenticationFailed(
                "E-mail ou senha inválidos. Verifique suas credenciais e tente novamente.",
                code="no_active_account"
            )
        except Exception as e:
            # Re-lança outras exceções sem modificação
            raise
        
        return data
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Adiciona dados customizados ao payload do token
        token['nome'] = user.nome_completo
        token['email'] = user.email
        token['tipo_usuario'] = user.tipo_usuario
        
        # Adiciona dados da escola (multi-tenancy)
        if user.escola:
            token['escola'] = EscolaTokenSerializer(user.escola).data
        else:
            token['escola'] = None

        return token

class UsuarioSerializer(serializers.ModelSerializer):
    """
    Serializer para visualização dos dados do usuário.
    """
    escola = EscolaTokenSerializer(read_only=True)
    
    class Meta:
        model = Usuario
        fields = [
            'id', 
            'email', 
            'nome_completo', 
            'tipo_usuario', 
            'escola', 
            'last_login', 
            'date_joined'
        ]
        read_only_fields = ('last_login', 'date_joined')


class PushTokenSerializer(serializers.ModelSerializer):
    """
    Serializer para o modelo PushToken, usado para registrar
    tokens de dispositivo para notificações push.
    """
    class Meta:
        model = PushToken
        fields = '__all__'
        read_only_fields = ('usuario', 'escola',)