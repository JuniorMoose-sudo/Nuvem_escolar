from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import AgendaDiaria
from .serializers import AgendaDiariaSerializer
# Importar permissões genéricas (Correção de Auditoria)
from apps.core.permissions import IsAdminDaEscola, IsProfessor, IsResponsavel
from apps.academico.models import Aluno
from apps.usuarios.models import Usuario

class AgendaDiariaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar a agenda diária dos alunos.
    - Professores podem criar e editar agendas para alunos de suas turmas.
    - Responsáveis podem visualizar as agendas de seus filhos.
    - Admins da escola podem ver e gerenciar todas as agendas.
    """
    serializer_class = AgendaDiariaSerializer
    permission_classes = [IsAuthenticated] # Permissão base, refinada abaixo

    def get_queryset(self):
        user = self.request.user

        # A query base agora usa a FK direta para escola (Correção de Auditoria)
        queryset = AgendaDiaria.objects.filter(escola=user.escola)

        if user.tipo_usuario == Usuario.TipoUsuario.ADMIN_ESCOLA:
            return queryset
        
        if user.tipo_usuario == Usuario.TipoUsuario.PROFESSOR:
            turmas_do_professor = user.perfil_professor.vinculos_turmas.values_list('turma_id', flat=True)
            return queryset.filter(aluno__turma__id__in=turmas_do_professor)

        if user.tipo_usuario == Usuario.TipoUsuario.RESPONSAVEL:
            alunos_do_responsavel = user.perfil_responsavel.vinculos_alunos.values_list('aluno_id', flat=True)
            return queryset.filter(aluno__id__in=alunos_do_responsavel)
        
        return AgendaDiaria.objects.none()

    def get_permissions(self):
        """ Define permissões genéricas por tipo de ação (Correção de Auditoria) """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Apenas Admins ou Professores podem escrever.
            # A lógica fina de "qual professor" é tratada nos métodos create/update.
            self.permission_classes = [IsAuthenticated, IsAdminDaEscola | IsProfessor]
        elif self.action in ['list', 'retrieve']:
            # Admins, Professores e Responsáveis podem ler.
            self.permission_classes = [IsAuthenticated, IsAdminDaEscola | IsProfessor | IsResponsavel]
        return super().get_permissions()

    def _validar_permissao_professor_aluno(self, user, aluno):
        """Helper para validar se um professor tem permissão para interagir com um aluno."""
        if user.tipo_usuario == Usuario.TipoUsuario.PROFESSOR:
            if not user.perfil_professor.vinculos_turmas.filter(turma=aluno.turma).exists():
                return False
        return True

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        aluno = get_object_or_404(Aluno, id=request.data.get('aluno_id'))
        user = request.user

        if not self._validar_permissao_professor_aluno(user, aluno):
            return Response(
                {'detail': 'Você não tem permissão para criar uma agenda para este aluno.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer.save(aluno=aluno)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        user = request.user
        aluno = instance.aluno # O aluno da agenda existente

        if not self._validar_permissao_professor_aluno(user, aluno):
            return Response(
                {'detail': 'Você não tem permissão para editar a agenda deste aluno.'},
                status=status.HTTP_403_FORBIDDEN
            )

        self.perform_update(serializer)
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)