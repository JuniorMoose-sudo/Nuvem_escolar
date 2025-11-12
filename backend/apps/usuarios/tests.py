from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from apps.core.models import Escola
from apps.usuarios.models import Usuario
import jwt
from django.conf import settings

class UsuariosAPITests(APITestCase):
    """
    Testes para a API de Usuários (autenticação e gerenciamento de conta).
    """

    def setUp(self):
        """
        Configura o ambiente de teste criando uma escola e um usuário.
        """
        self.escola = Escola.objects.create(
            nome_fantasia="Escola Teste",
            razao_social="Escola Teste LTDA",
            cnpj="12345678000199"
        )
        self.password = "testpass123"
        self.user = Usuario.objects.create_user(
            email="professor@teste.com",
            nome_completo="Professor Teste",
            password=self.password,
            escola=self.escola,
            tipo_usuario=Usuario.TipoUsuario.PROFESSOR
        )
        self.token_url = reverse('usuarios:token_obtain_pair')
        self.me_url = reverse('usuarios:minha_conta')

    def test_obter_token_jwt_sucesso(self):
        """
        Verifica se um usuário com credenciais válidas consegue obter um token.
        """
        data = {
            "email": self.user.email,
            "password": self.password
        }
        response = self.client.post(self.token_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_obter_token_jwt_falha(self):
        """
        Verifica se credenciais inválidas retornam erro 401.
        """
        data = {
            "email": self.user.email,
            "password": "wrongpassword"
        }
        response = self.client.post(self.token_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_payload_customizado_do_token(self):
        """
        Verifica se o payload do token de acesso contém os dados customizados.
        """
        data = {"email": self.user.email, "password": self.password}
        response = self.client.post(self.token_url, data, format='json')
        access_token = response.data['access']
        
        # Decodifica o token sem verificar a assinatura para inspecionar o payload
        decoded_token = jwt.decode(access_token, options={"verify_signature": False})
        
        self.assertEqual(decoded_token['user_id'], self.user.id)
        self.assertEqual(decoded_token['email'], self.user.email)
        self.assertEqual(decoded_token['nome'], self.user.nome_completo)
        self.assertEqual(decoded_token['tipo_usuario'], self.user.tipo_usuario)
        self.assertEqual(decoded_token['escola']['id'], str(self.escola.id))
        self.assertEqual(decoded_token['escola']['nome_fantasia'], self.escola.nome_fantasia)

    def test_acessar_endpoint_me_autenticado(self):
        """
        Verifica se um usuário autenticado pode acessar seus próprios dados em /me/.
        """
        data = {"email": self.user.email, "password": self.password}
        response = self.client.post(self.token_url, data, format='json')
        access_token = response.data['access']
        
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        response_me = self.client.get(self.me_url)
        
        self.assertEqual(response_me.status_code, status.HTTP_200_OK)
        self.assertEqual(response_me.data['email'], self.user.email)
        self.assertEqual(response_me.data['nome_completo'], self.user.nome_completo)

    def test_acessar_endpoint_me_nao_autenticado(self):
        """
        Verifica se um usuário não autenticado recebe erro 401 ao tentar acessar /me/.
        """
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)