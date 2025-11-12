from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, MinhaContaView

app_name = 'usuarios'

urlpatterns = [
    # 1. Autenticação JWT
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # 2. Gerenciamento da Conta do Usuário Logado
    path('me/', MinhaContaView.as_view(), name='minha_conta'),
]
