from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import UsuarioSerializer, CustomTokenObtainPairSerializer
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from .serializers import PushTokenSerializer
from .utils import send_fcm_message

class PushTokenViewSet(viewsets.ModelViewSet):
    """ViewSet simples para registrar e remover device tokens."""
    serializer_class = PushTokenSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.request.user.push_tokens.all()

    def perform_create(self, serializer):
        # Associa o token ao usuário logado e, se possível, à sua escola
        serializer.save(usuario=self.request.user, escola=getattr(self.request.user, 'escola', None))

    def create(self, request, *args, **kwargs):
        # Evita duplicates: se token já existe, atualiza plataforma/usuario
        token = request.data.get('token')
        plataforma = request.data.get('plataforma', 'FCM')
        if not token:
            return Response({'detail': 'token é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)

        from .models import PushToken
        obj, created = PushToken.objects.update_or_create(
            token=token,
            defaults={'usuario': request.user, 'escola': getattr(request.user, 'escola', None), 'plataforma': plataforma}
        )
        serializer = self.get_serializer(obj)
        return Response(serializer.data, status=(status.HTTP_201_CREATED if created else status.HTTP_200_OK))

    @action(detail=False, methods=['post'], url_path='remove')
    def remove_token(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'detail': 'token é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
        from .models import PushToken
        PushToken.objects.filter(token=token, usuario=request.user).delete()
        return Response({'detail': 'token removido.'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='test-notify')
    def test_notify(self, request):
        """Endpoint de teste para enviar notificação a um token específico."""
        token = request.data.get('token')
        title = request.data.get('title', 'Teste Nuvem Escolar')
        body = request.data.get('body', 'Esta é uma notificação de teste.')
        if not token:
            return Response({'detail': 'token é obrigatório.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            result = send_fcm_message(token, title, body)
            return Response({'detail': 'enviado', 'result': result})
        except Exception as e:
            return Response({'detail': 'erro ao enviar', 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
