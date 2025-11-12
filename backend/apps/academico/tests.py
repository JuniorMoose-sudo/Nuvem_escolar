from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from apps.core.models import Escola
from apps.usuarios.models import Usuario, PerfilProfessor
from apps.academico.models import Turma, Materia

class AcademicoAPITests(APITestCase):
    """
    Testes para a API do app Academico, com foco em multi-tenancy.
    """

    @classmethod
    def setUpTestData(cls):
        """
        Configura dados que serão usados por todos os testes da classe.
        Cria duas escolas e um professor para cada uma.
        """
        # Escola 1 e seu professor
        cls.escola1 = Escola.objects.create(
            nome_fantasia="Escola A", razao_social="Escola A LTDA", cnpj="11111111000111"
        )
        cls.professor1 = Usuario.objects.create_user(
            email="prof1@escola_a.com",
            nome_completo="Professor A",
            password="testpass",
            escola=cls.escola1,
            tipo_usuario=Usuario.TipoUsuario.PROFESSOR
        )
        PerfilProfessor.objects.create(usuario=cls.professor1)

        # Escola 2 e seu professor
        cls.escola2 = Escola.objects.create(
            nome_fantasia="Escola B", razao_social="Escola B LTDA", cnpj="22222222000122"
        )
        cls.professor2 = Usuario.objects.create_user(
            email="prof2@escola_b.com",
            nome_completo="Professor B",
            password="testpass",
            escola=cls.escola2,
            tipo_usuario=Usuario.TipoUsuario.PROFESSOR
        )
        PerfilProfessor.objects.create(usuario=cls.professor2)

        # Entidades acadêmicas pertencentes apenas à Escola 1
        cls.turma_escola1 = Turma.objects.create(
            escola=cls.escola1, nome="Turma 1A", ano_letivo=2025
        )
        cls.materia_escola1 = Materia.objects.create(escola=cls.escola1, nome="Matemática")

        cls.turmas_url = reverse('academico:turma-list')
        cls.materias_url = reverse('academico:materia-list')

    def _autenticar_usuario(self, user):
        """Método auxiliar para autenticar um usuário e definir o token no cliente."""
        self.client.force_authenticate(user=user)

    def test_professor_lista_apenas_turmas_da_sua_escola(self):
        """
        Verifica se o Professor A (Escola A) lista apenas a turma da Escola A.
        """
        self._autenticar_usuario(self.professor1)
        response = self.client.get(self.turmas_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], str(self.turma_escola1.id))

    def test_professor_nao_lista_turmas_de_outra_escola(self):
        """
        Verifica se o Professor B (Escola B) não lista nenhuma turma, pois não há
        turmas cadastradas para a Escola B.
        """
        self._autenticar_usuario(self.professor2)
        response = self.client.get(self.turmas_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

    def test_criar_materia_associa_a_escola_correta(self):
        """
        Verifica se uma nova matéria criada pelo Professor A é automaticamente
        associada à Escola A.
        """
        self._autenticar_usuario(self.professor1)
        data = {"nome": "Ciências"}
        
        # O serializer foi ajustado para pegar a escola do usuário logado
        # então não precisamos enviar o ID da escola.
        response = self.client.post(self.materias_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['nome'], "Ciências")
        
        # Verifica no banco de dados se a escola foi associada corretamente
        materia_criada = Materia.objects.get(id=response.data['id'])
        self.assertEqual(materia_criada.escola, self.escola1)

    def test_usuario_nao_autenticado_nao_acessa_endpoints(self):
        """
        Verifica se tentativas de acesso sem autenticação são bloqueadas.
        """
        self.client.force_authenticate(user=None)
        response = self.client.get(self.turmas_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)