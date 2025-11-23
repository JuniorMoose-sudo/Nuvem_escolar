from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter
from .views import CustomTokenObtainPairView, MinhaContaView, PushTokenViewSet

app_name = 'usuarios'

router = DefaultRouter()
router.register(r'push-tokens', PushTokenViewSet, basename='push-token')

urlpatterns = [
    # 1. Autenticação JWT
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # 2. Gerenciamento da Conta do Usuário Logado
    path('me/', MinhaContaView.as_view(), name='minha_conta'),

    # 3. Push tokens
    path('', include(router.urls)),
]
