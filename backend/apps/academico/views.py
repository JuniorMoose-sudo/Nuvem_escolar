from rest_framework import viewsets
from rest_framework import filters
from rest_framework.permissions import IsAuthenticated
# Importar permissões granulares (Correção de Auditoria)
from apps.core.permissions import IsAdminDaEscola, IsProfessor, IsResponsavel
from apps.usuarios.models import Usuario

from .models import Aluno, Turma, Materia, ProfessorTurma, ResponsavelAluno
from .serializers import (
    MateriaSerializer,
    TurmaSerializer,
    AlunoSerializer,
    ProfessorTurmaSerializer,
    ResponsavelAlunoSerializer
)

class MateriaViewSet(viewsets.ModelViewSet):
    serializer_class = MateriaSerializer
    # Apenas Admins e Professores podem gerenciar matérias.
    permission_classes = [IsAuthenticated, IsAdminDaEscola | IsProfessor]

    def get_queryset(self):
        # Todos os professores e admins podem ver as matérias da escola.
        return Materia.objects.filter(escola=self.request.user.escola).order_by('nome')

    def perform_create(self, serializer):
        serializer.save(escola=self.request.user.escola)

class TurmaViewSet(viewsets.ModelViewSet):
    serializer_class = TurmaSerializer
    # Apenas Admins e Professores podem ver turmas.
    permission_classes = [IsAuthenticated, IsAdminDaEscola | IsProfessor]

    def get_queryset(self):
        """ Filtra as turmas com base no perfil do usuário (Correção de Auditoria) """
        user = self.request.user
        if user.tipo_usuario == Usuario.TipoUsuario.ADMIN_ESCOLA:
            return Turma.objects.filter(escola=user.escola).order_by('nome')
        if user.tipo_usuario == Usuario.TipoUsuario.PROFESSOR:
            # Professor vê apenas as turmas às quais está vinculado.
            return Turma.objects.filter(vinculos_professores__professor=user.perfil_professor).order_by('nome')
        return Turma.objects.none()

    def perform_create(self, serializer):
        serializer.save(escola=self.request.user.escola)

class AlunoViewSet(viewsets.ModelViewSet):
    serializer_class = AlunoSerializer
    # Permite busca via parâmetro `?search=` por nome ou matrícula
    filter_backends = [filters.SearchFilter]
    search_fields = ['nome_completo', 'matricula']
    # Admins, Professores e Responsáveis podem ver alunos.
    permission_classes = [IsAuthenticated, IsAdminDaEscola | IsProfessor | IsResponsavel]

    def get_queryset(self):
        """ Filtra os alunos com base no perfil do usuário (Correção de Auditoria) """
        user = self.request.user
        if user.tipo_usuario == Usuario.TipoUsuario.ADMIN_ESCOLA:
            return Aluno.objects.filter(escola=user.escola).order_by('nome_completo')
        if user.tipo_usuario == Usuario.TipoUsuario.PROFESSOR:
            # Professor vê apenas os alunos de suas turmas.
            turmas_ids = user.perfil_professor.vinculos_turmas.values_list('turma_id', flat=True)
            return Aluno.objects.filter(turma__id__in=turmas_ids).order_by('nome_completo')
        if user.tipo_usuario == Usuario.TipoUsuario.RESPONSAVEL:
            # Responsável vê apenas seus filhos.
            return Aluno.objects.filter(vinculos_responsaveis__responsavel=user.perfil_responsavel).order_by('nome_completo')
        return Aluno.objects.none()

    def perform_create(self, serializer):
        serializer.save(escola=self.request.user.escola)

class ProfessorTurmaViewSet(viewsets.ModelViewSet):
    serializer_class = ProfessorTurmaSerializer
    permission_classes = [IsAuthenticated, IsAdminDaEscola]

    def get_queryset(self):
        return ProfessorTurma.objects.filter(turma__escola=self.request.user.escola)

class ResponsavelAlunoViewSet(viewsets.ModelViewSet):
    serializer_class = ResponsavelAlunoSerializer
    permission_classes = [IsAuthenticated, IsAdminDaEscola]

    def get_queryset(self):
        return ResponsavelAluno.objects.filter(aluno__escola=self.request.user.escola)