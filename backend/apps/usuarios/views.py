from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import UsuarioSerializer, CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    """ View customizada para obter o par de tokens (access e refresh), utilizando o serializer customizado que adiciona o payload. """
    serializer_class = CustomTokenObtainPairSerializer

class MinhaContaView(APIView):
    """ Endpoint unificado para visualizar (GET) e atualizar (PUT/PATCH) os dados do próprio usuário logado ('me/'). """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """ Retorna os dados do usuário logado. """
        serializer = UsuarioSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        """ Atualiza todos os dados do usuário logado. """
        serializer = UsuarioSerializer(request.user, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request):
        """ Atualiza parcialmente os dados do usuário logado. """
        serializer = UsuarioSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
