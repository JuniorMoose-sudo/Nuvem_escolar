from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Usuario
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
    adicionais (payload) ao access token.
    """
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