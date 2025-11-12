from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from apps.core.models import Escola
from apps.usuarios.models import Usuario, PerfilProfessor, PerfilResponsavel
from apps.academico.models import Turma, Aluno, ProfessorTurma, ResponsavelAluno
from apps.comunicacao.models import AgendaDiaria
from datetime import date

class ComunicacaoAPITests(APITestCase):
    """
    Testes para a API do app Comunicacao, focados nas permissões da AgendaDiaria.
    """

    @classmethod
    def setUpTestData(cls):
        cls.escola = Escola.objects.create(nome_fantasia="Escola Padrão", cnpj="33333333000133")

        # --- Usuários ---
        cls.professor_user = Usuario.objects.create_user(
            email="prof@escola.com", nome_completo="Professor Titular", 
            password="testpass", escola=cls.escola, tipo_usuario=Usuario.TipoUsuario.PROFESSOR
        )
        PerfilProfessor.objects.create(usuario=cls.professor_user)

        cls.responsavel_user = Usuario.objects.create_user(
            email="resp@escola.com", nome_completo="Responsável Legal", 
            password="testpass", escola=cls.escola, tipo_usuario=Usuario.TipoUsuario.RESPONSAVEL
        )
        PerfilResponsavel.objects.create(usuario=cls.responsavel_user)
        
        cls.outro_responsavel_user = Usuario.objects.create_user(
            email="outro@escola.com", nome_completo="Outro Responsável", 
            password="testpass", escola=cls.escola, tipo_usuario=Usuario.TipoUsuario.RESPONSAVEL
        )
        PerfilResponsavel.objects.create(usuario=cls.outro_responsavel_user)

        # --- Estrutura Acadêmica ---
        cls.turma = Turma.objects.create(escola=cls.escola, nome="Maternal II", ano_letivo=2025)
        cls.aluno = Aluno.objects.create(escola=cls.escola, nome_completo="Aluno Teste", matricula="12345", turma=cls.turma)
        
        # --- Vínculos ---
        ProfessorTurma.objects.create(professor=cls.professor_user.perfil_professor, turma=cls.turma)
        ResponsavelAluno.objects.create(responsavel=cls.responsavel_user.perfil_responsavel, aluno=cls.aluno, responsavel_principal=True)

        # --- URLs ---
        cls.agendas_url = reverse('comunicacao:agenda-diaria-list')

    def _autenticar_usuario(self, user):
        self.client.force_authenticate(user=user)

    def test_professor_pode_criar_agenda_para_aluno_da_sua_turma(self):
        """
        Verifica se um professor pode criar uma agenda para um aluno de sua turma.
        """
        self._autenticar_usuario(self.professor_user)
        data = {
            "aluno_id": self.aluno.id,
            "data": date.today(),
            "atividades": [{"tipo": "Alimentação", "horario": "12:30", "observacao": "Comeu bem."}]
        }
        response = self.client.post(self.agendas_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(AgendaDiaria.objects.filter(aluno=self.aluno, data=date.today()).exists())

    def test_responsavel_nao_pode_criar_agenda(self):
        """
        Verifica se um responsável é bloqueado ao tentar criar uma agenda.
        """
        self._autenticar_usuario(self.responsavel_user)
        data = {
            "aluno_id": self.aluno.id,
            "data": date.today(),
            "atividades": []
        }
        response = self.client.post(self.agendas_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_responsavel_pode_ver_agenda_do_seu_filho(self):
        """
        Verifica se um responsável pode listar e ver a agenda do seu filho.
        """
        # Professor cria a agenda primeiro
        agenda = AgendaDiaria.objects.create(
            aluno=self.aluno, data=date.today(), observacoes_professor="Brincou bastante."
        )
        
        self._autenticar_usuario(self.responsavel_user)
        response = self.client.get(self.agendas_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], str(agenda.id))

    def test_responsavel_nao_ve_agenda_de_outro_aluno(self):
        """
        Verifica se um responsável não tem acesso à agenda de um aluno que não é seu filho.
        """
        AgendaDiaria.objects.create(
            aluno=self.aluno, data=date.today(), observacoes_professor="Dia tranquilo."
        )
        
        # Autentica com um responsável não relacionado ao aluno
        self._autenticar_usuario(self.outro_responsavel_user)
        response = self.client.get(self.agendas_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0) # A lista deve vir vazia

    def test_responsavel_nao_pode_editar_agenda(self):
        """
        Verifica se um responsável é bloqueado ao tentar editar uma agenda.
        """
        agenda = AgendaDiaria.objects.create(aluno=self.aluno, data=date.today())
        agenda_detalhe_url = reverse('comunicacao:agenda-diaria-detail', kwargs={'pk': agenda.pk})
        
        self._autenticar_usuario(self.responsavel_user)
        data = {"observacoes_professor": "Tentativa de edição."}
        response = self.client.patch(agenda_detalhe_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)