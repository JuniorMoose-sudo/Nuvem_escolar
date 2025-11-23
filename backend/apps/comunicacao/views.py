from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import AgendaDiaria, Momento, Comunicado, Comentario, Curtida
from .serializers import (
    AgendaDiariaSerializer,
    MomentoSerializer,
    ComunicadoSerializer,
    ComentarioSerializer,
    CurtidaSerializer
)
# Importar permissões genéricas (Correção de Auditoria)
from apps.core.permissions import IsAdminDaEscola, IsProfessor, IsResponsavel
from apps.academico.models import Aluno, Turma
from apps.usuarios.models import Usuario
from django.conf import settings

# boto3 é opcional: endpoint de presign funciona apenas se boto3 estiver instalado e configurações AWS presentes
try:
    import boto3
    from botocore.exceptions import ClientError
    _HAS_BOTO3 = True
except Exception:
    boto3 = None
    ClientError = Exception
    _HAS_BOTO3 = False

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

        # Superusuários veem todas as agendas
        if user.is_superuser or user.tipo_usuario == Usuario.TipoUsuario.ADMIN_SISTEMA:
            return AgendaDiaria.objects.all()

        # A query base agora usa a FK direta para escola (Correção de Auditoria)
        if not hasattr(user, 'escola') or not user.escola:
            return AgendaDiaria.objects.none()
        
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
        
        # Pega o aluno do validated_data (já validado pelo serializer)
        aluno = serializer.validated_data.get('aluno')
        if not aluno:
            # Fallback: tenta pegar do request.data se não estiver no validated_data
            aluno_id = request.data.get('aluno_id')
            if not aluno_id:
                return Response(
                    {'detail': 'O campo aluno_id é obrigatório.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            aluno = get_object_or_404(Aluno, id=aluno_id)
        
        user = request.user

        # Valida permissão: professor só pode criar para alunos de suas turmas
        if not self._validar_permissao_professor_aluno(user, aluno):
            return Response(
                {'detail': 'Você não tem permissão para criar uma agenda para este aluno.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Garante que a escola seja a mesma do aluno (multi-tenancy)
        serializer.save(aluno=aluno, escola=aluno.escola)
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


# ============================================================================
# SPRINT 4 - ViewSets para Feed de Momentos e Comunicação
# ============================================================================

class MomentoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar momentos (fotos/vídeos).
    - Professores podem criar para suas turmas.
    - Responsáveis visualizam momentos dos seus filhos.
    - Admins veem todos os momentos da escola.
    """
    serializer_class = MomentoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Superusuários veem todos os momentos
        if user.is_superuser or user.tipo_usuario == Usuario.TipoUsuario.ADMIN_SISTEMA:
            return Momento.objects.all()
        
        if not hasattr(user, 'escola') or not user.escola:
            return Momento.objects.none()
        
        queryset = Momento.objects.filter(escola=user.escola)
        
        if user.tipo_usuario == Usuario.TipoUsuario.ADMIN_ESCOLA:
            return queryset
        
        if user.tipo_usuario == Usuario.TipoUsuario.PROFESSOR:
            # Professor vê momentos das suas turmas
            turmas_ids = user.perfil_professor.vinculos_turmas.values_list('turma_id', flat=True)
            return queryset.filter(turma__id__in=turmas_ids)
        
        if user.tipo_usuario == Usuario.TipoUsuario.RESPONSAVEL:
            # Responsável vê momentos dos seus filhos
            alunos_ids = user.perfil_responsavel.vinculos_alunos.values_list('aluno_id', flat=True)
            return queryset.filter(alunos__id__in=alunos_ids).distinct()
        
        return Momento.objects.none()
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAuthenticated, IsAdminDaEscola | IsProfessor]
        elif self.action in ['list', 'retrieve']:
            self.permission_classes = [IsAuthenticated, IsAdminDaEscola | IsProfessor | IsResponsavel]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        """Garante que o autor seja o usuário logado e a escola seja correta."""
        user = self.request.user
        turma_id = serializer.validated_data.get('turma_id')
        
        # Valida que professor só pode criar para suas turmas
        if user.tipo_usuario == Usuario.TipoUsuario.PROFESSOR and turma_id:
            if not user.perfil_professor.vinculos_turmas.filter(turma_id=turma_id).exists():
                raise ValidationError(
                    {'turma_id': 'Você não tem permissão para criar momentos para esta turma.'}
                )
        
        # Pega a turma e alunos
        turma = None
        if turma_id:
            turma = get_object_or_404(Turma, id=turma_id)
        
        alunos_ids = serializer.validated_data.pop('alunos_ids', [])
        
        momento = serializer.save(autor=user, turma=turma, escola=user.escola)
        
        # Adiciona alunos se fornecidos
        if alunos_ids:
            alunos = Aluno.objects.filter(id__in=alunos_ids, escola=user.escola)
            momento.alunos.set(alunos)
        # Se o frontend usou presigned uploads, pode enviar file_keys com as chaves no S3
        file_keys = self.request.data.get('file_keys') or self.request.data.get('file_keys[]')
        if file_keys:
            try:
                # Suporta lista ou string JSON
                if isinstance(file_keys, str):
                    import json
                    file_keys = json.loads(file_keys)

                if isinstance(file_keys, (list, tuple)) and len(file_keys) > 0:
                    # Usa a primeira chave como arquivo principal
                    key = file_keys[0]
                    # Atribui o nome do arquivo diretamente ao FileField (funciona com storage S3)
                    momento.arquivo.name = key
                    momento.save(update_fields=['arquivo'])
            except Exception:
                # Fail silently: não bloquear criação do momento se não conseguir associar arquivo
                pass
    
    @action(detail=True, methods=['post', 'delete'])
    def curtir(self, request, pk=None):
        """Curtir ou descurtir um momento."""
        momento = self.get_object()
        usuario = request.user
        
        if request.method == 'POST':
            # Criar curtida
            curtida, created = Curtida.objects.get_or_create(
                usuario=usuario,
                momento=momento
            )
            if created:
                return Response({'detail': 'Momento curtido com sucesso.'}, status=status.HTTP_201_CREATED)
            return Response({'detail': 'Você já curtiu este momento.'}, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            # Remover curtida
            curtida = Curtida.objects.filter(usuario=usuario, momento=momento).first()
            if curtida:
                curtida.delete()
                return Response({'detail': 'Curtida removida.'}, status=status.HTTP_200_OK)
            return Response({'detail': 'Você não curtiu este momento.'}, status=status.HTTP_404_NOT_FOUND)

        @action(detail=False, methods=['post'], url_path='presign', permission_classes=[IsAuthenticated, IsAdminDaEscola | IsProfessor])
        def presign(self, request):
            """Gera presigned URLs para upload direto ao S3.

            Espera um payload: { "files": [{"name": "foto.jpg", "type": "image/jpeg"}, ...] }
            Retorna: [{"key": "momentos/..jpg", "url": "https://...", "fields": {...}}]
            """
            if not _HAS_BOTO3:
                return Response({
                    'detail': 'boto3 não está instalado no servidor. Instale boto3 para usar presign.'
                }, status=status.HTTP_501_NOT_IMPLEMENTED)

            files = request.data.get('files') or []
            if not isinstance(files, list) or not files:
                return Response({'detail': 'Informe a lista de arquivos.'}, status=status.HTTP_400_BAD_REQUEST)

            bucket = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', None)
            region = getattr(settings, 'AWS_S3_REGION_NAME', None)
            if not bucket:
                return Response({'detail': 'Configuração AWS_STORAGE_BUCKET_NAME ausente.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            s3_client = boto3.client('s3')
            results = []
            for f in files:
                name = f.get('name')
                content_type = f.get('type', 'application/octet-stream')
                if not name:
                    continue

                # Gere uma key simples - delega a prefix para o backend (momentos/..)
                import uuid
                ext = name.split('.')[-1]
                key = f"momentos/{request.user.escola.id}/{uuid.uuid4()}.{ext}"

                try:
                    presigned = s3_client.generate_presigned_post(
                        Bucket=bucket,
                        Key=key,
                        Fields={"Content-Type": content_type},
                        Conditions=[{"Content-Type": content_type}],
                        ExpiresIn=300,
                    )
                    results.append({
                        'key': key,
                        'url': presigned.get('url'),
                        'fields': presigned.get('fields')
                    })
                except ClientError as e:
                    return Response({'detail': f'Erro ao gerar presigned URL: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            return Response(results)


class ComunicadoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar comunicados.
    - Professores e Admins podem criar.
    - Responsáveis visualizam comunicados das turmas dos seus filhos.
    """
    serializer_class = ComunicadoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Superusuários veem todos os comunicados
        if user.is_superuser or user.tipo_usuario == Usuario.TipoUsuario.ADMIN_SISTEMA:
            return Comunicado.objects.all()
        
        if not hasattr(user, 'escola') or not user.escola:
            return Comunicado.objects.none()
        
        queryset = Comunicado.objects.filter(escola=user.escola)
        
        if user.tipo_usuario == Usuario.TipoUsuario.ADMIN_ESCOLA:
            return queryset
        
        if user.tipo_usuario == Usuario.TipoUsuario.PROFESSOR:
            # Professor vê comunicados das suas turmas ou gerais da escola
            turmas_ids = user.perfil_professor.vinculos_turmas.values_list('turma_id', flat=True)
            return queryset.filter(Q(turma__id__in=turmas_ids) | Q(turma__isnull=True))
        
        if user.tipo_usuario == Usuario.TipoUsuario.RESPONSAVEL:
            # Responsável vê comunicados das turmas dos seus filhos ou gerais
            alunos_ids = user.perfil_responsavel.vinculos_alunos.values_list('aluno_id', flat=True)
            turmas_ids = Aluno.objects.filter(id__in=alunos_ids).values_list('turma_id', flat=True)
            return queryset.filter(Q(turma__id__in=turmas_ids) | Q(turma__isnull=True))
        
        return Comunicado.objects.none()
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [IsAuthenticated, IsAdminDaEscola | IsProfessor]
        elif self.action in ['list', 'retrieve']:
            self.permission_classes = [IsAuthenticated, IsAdminDaEscola | IsProfessor | IsResponsavel]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        """Garante que o autor seja o usuário logado e a escola seja correta."""
        user = self.request.user
        turma_id = serializer.validated_data.get('turma_id')
        
        # Valida que professor só pode criar para suas turmas
        if user.tipo_usuario == Usuario.TipoUsuario.PROFESSOR and turma_id:
            if not user.perfil_professor.vinculos_turmas.filter(turma_id=turma_id).exists():
                raise ValidationError(
                    {'turma_id': 'Você não tem permissão para criar comunicados para esta turma.'}
                )
        
        turma = None
        if turma_id:
            turma = get_object_or_404(Turma, id=turma_id)
        
        serializer.save(autor=user, turma=turma, escola=user.escola)
    
    @action(detail=True, methods=['post', 'delete'])
    def curtir(self, request, pk=None):
        """Curtir ou descurtir um comunicado."""
        comunicado = self.get_object()
        usuario = request.user
        
        if request.method == 'POST':
            curtida, created = Curtida.objects.get_or_create(
                usuario=usuario,
                comunicado=comunicado
            )
            if created:
                return Response({'detail': 'Comunicado curtido com sucesso.'}, status=status.HTTP_201_CREATED)
            return Response({'detail': 'Você já curtiu este comunicado.'}, status=status.HTTP_400_BAD_REQUEST)
        
        elif request.method == 'DELETE':
            curtida = Curtida.objects.filter(usuario=usuario, comunicado=comunicado).first()
            if curtida:
                curtida.delete()
                return Response({'detail': 'Curtida removida.'}, status=status.HTTP_200_OK)
            return Response({'detail': 'Você não curtiu este comunicado.'}, status=status.HTTP_404_NOT_FOUND)


class ComentarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar comentários em momentos e comunicados.
    """
    serializer_class = ComentarioSerializer
    permission_classes = [IsAuthenticated, IsAdminDaEscola | IsProfessor | IsResponsavel]
    
    def get_queryset(self):
        momento_id = self.request.query_params.get('momento_id')
        comunicado_id = self.request.query_params.get('comunicado_id')
        
        queryset = Comentario.objects.all()
        
        if momento_id:
            queryset = queryset.filter(momento_id=momento_id)
        elif comunicado_id:
            queryset = queryset.filter(comunicado_id=comunicado_id)
        else:
            queryset = queryset.none()
        
        return queryset.order_by('data_criacao')
    
    def perform_create(self, serializer):
        """Garante que o autor seja o usuário logado."""
        serializer.save(usuario=self.request.user)


class CurtidaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet apenas para leitura de curtidas.
    A criação/deleção é feita via actions dos ViewSets de Momento e Comunicado.
    """
    serializer_class = CurtidaSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        momento_id = self.request.query_params.get('momento_id')
        comunicado_id = self.request.query_params.get('comunicado_id')
        
        queryset = Curtida.objects.all()
        
        if momento_id:
            queryset = queryset.filter(momento_id=momento_id)
        elif comunicado_id:
            queryset = queryset.filter(comunicado_id=comunicado_id)
        else:
            queryset = queryset.none()
        
        return queryset