from rest_framework import serializers
from django.db import transaction
from .models import (
    AgendaDiaria, Momento, Comunicado, Comentario, Curtida
)
from apps.academico.models import Aluno, Turma
from apps.academico.serializers import AlunoSerializer, TurmaSerializer
from apps.usuarios.models import Usuario
from apps.usuarios.serializers import UsuarioSerializer
from .validators import validate_file_size, validate_image_file, validate_video_file
from django.utils import timezone

from apps.usuarios.models import Usuario
from django.db import transaction


class AtividadeSerializer(serializers.Serializer):
    """Serializer para validar a estrutura de cada atividade."""
    tipo = serializers.CharField(max_length=100)
    horario = serializers.CharField(max_length=5)
    observacao = serializers.CharField()


class AgendaDiariaSerializer(serializers.ModelSerializer):
    """
    Serializer para o modelo AgendaDiaria.
    Permite a criação de uma agenda para um único aluno ou para todos os
    alunos de um professor.
    """
    aluno = AlunoSerializer(read_only=True)
    aluno_id = serializers.UUIDField(write_only=True, source='aluno', required=False, allow_null=True)
    atividades = AtividadeSerializer(many=True)
    para_todos_alunos = serializers.BooleanField(write_only=True, default=False)

    class Meta:
        model = AgendaDiaria
        fields = [
            'id',
            'aluno',
            'aluno_id',
            'data',
            'atividades',
            'observacoes_professor',
            'para_todos_alunos',  # Adicionado
            'data_criacao',
            'data_atualizacao',
            'escola',
        ]
        read_only_fields = ['id', 'data_criacao', 'data_atualizacao', 'escola']

    def validate_data(self, value):
        """ Impede que a agenda seja criada para uma data futura. """
        if value > timezone.now().date():
            raise serializers.ValidationError("Não é possível criar uma agenda para uma data futura.")
        return value

    def validate(self, data):
        """
        Validações cruzadas:
        1. Se `para_todos_alunos` é False, `aluno_id` é obrigatório.
        2. Unicidade da agenda (aluno + data).
        3. Valida que o aluno pertence à escola do usuário (multi-tenancy).
        """
        para_todos = data.get('para_todos_alunos', False)
        # O source de 'aluno_id' é 'aluno', então o valor estará em 'data.get('aluno')'
        aluno_id = data.get('aluno')

        if not para_todos and not aluno_id:
            raise serializers.ValidationError({
                'aluno_id': 'Este campo é obrigatório quando "para_todos_alunos" é falso.'
            })

        if para_todos and aluno_id:
            raise serializers.ValidationError({
                'aluno_id': 'Este campo não deve ser preenchido quando "para_todos_alunos" é verdadeiro.'
            })

        user = self.context['request'].user
        
        # Se for para todos, a validação de unicidade e multi-tenancy será feita no `create`
        if para_todos:
            if user.tipo_usuario != Usuario.TipoUsuario.PROFESSOR:
                raise serializers.ValidationError("Apenas professores podem usar a opção 'para_todos_alunos'.")
            return data

        # --- Lógica original para um único aluno ---
        try:
            # Resolve o objeto Aluno a partir do UUID
            aluno = Aluno.objects.get(id=aluno_id.id) # .id porque o valor é um objeto Aluno preguiçoso
            data['aluno'] = aluno
        except (Aluno.DoesNotExist, AttributeError):
            raise serializers.ValidationError({'aluno_id': 'Aluno não encontrado.'})

        # Validação de multi-tenancy
        if hasattr(user, 'escola') and user.escola:
            if aluno.escola != user.escola:
                raise serializers.ValidationError(
                    {"aluno_id": "Este aluno não pertence à sua escola."}
                )

        # Validação de unicidade para um único aluno
        queryset = AgendaDiaria.objects.filter(aluno=aluno, data=data.get('data'))
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                {"data": "Este aluno já possui uma agenda para esta data."}
            )

        return data

    @transaction.atomic
    def create(self, validated_data):
        """
        Cria uma ou múltiplas instâncias de AgendaDiaria.
        """
        para_todos = validated_data.pop('para_todos_alunos', False)
        
        if not para_todos:
            # Comportamento padrão: criar uma única agenda
            return super().create(validated_data)

        # --- Lógica para criar para todos os alunos ---
        user = self.context['request'].user
        escola = user.escola
        data_agenda = validated_data.get('data')

        try:
            professor = user.perfil_professor
        except Usuario.perfil_professor.RelatedObjectDoesNotExist:
            raise serializers.ValidationError({"detail": "O usuário não é um professor."})

        # Encontra todas as turmas do professor (principal ou vinculado)
        turmas_principais = Turma.objects.filter(professor_principal=professor)
        turmas_vinculadas = Turma.objects.filter(vinculos_professores__professor=professor)
        turmas = (turmas_principais | turmas_vinculadas).distinct()
        
        # Encontra todos os alunos dessas turmas
        alunos = Aluno.objects.filter(turma__in=turmas, escola=escola).distinct()

        if not alunos.exists():
            raise serializers.ValidationError({"detail": "Nenhum aluno encontrado para este professor."})

        # Verifica duplicatas: quais alunos já têm agenda para esta data?
        alunos_com_agenda = AgendaDiaria.objects.filter(
            aluno__in=alunos,
            data=data_agenda
        ).values_list('aluno_id', flat=True)

        alunos_para_criar = [
            aluno for aluno in alunos if aluno.id not in alunos_com_agenda
        ]
        
        if not alunos_para_criar:
            raise serializers.ValidationError({"data": "Todos os alunos deste professor já possuem uma agenda para esta data."})

        agendas_para_criar = [
            AgendaDiaria(
                escola=escola,
                aluno=aluno,
                data=data_agenda,
                atividades=validated_data.get('atividades'),
                observacoes_professor=validated_data.get('observacoes_professor')
            ) for aluno in alunos_para_criar
        ]

        try:
            created_agendas = AgendaDiaria.objects.bulk_create(agendas_para_criar)
            # Retorna a primeira instância criada para satisfazer a resposta do DRF
            return created_agendas[0]
        except Exception as e:
            # Em caso de erro no bulk_create, lança uma exceção de validação
            raise serializers.ValidationError({"detail": f"Erro ao criar agendas em massa: {e}"})


# ============================================================================
# SPRINT 4 - Serializers para Feed de Momentos e Comunicação
# ============================================================================

class CurtidaSerializer(serializers.ModelSerializer):
    """Serializer para Curtida."""
    usuario = UsuarioSerializer(read_only=True)
    
    class Meta:
        model = Curtida
        fields = ['id', 'usuario', 'data_criacao']
        read_only_fields = ['id', 'data_criacao']


class ComentarioSerializer(serializers.ModelSerializer):
    """Serializer para Comentario."""
    usuario = UsuarioSerializer(read_only=True)
    respostas = serializers.SerializerMethodField()
    
    class Meta:
        model = Comentario
        fields = [
            'id', 'usuario', 'texto', 'data_criacao', 'data_atualizacao',
            'comentario_pai', 'respostas'
        ]
        read_only_fields = ['id', 'data_criacao', 'data_atualizacao']
    
    def get_respostas(self, obj):
        """Retorna as respostas do comentário."""
        respostas = obj.respostas.all()
        return ComentarioSerializer(respostas, many=True, read_only=True).data


class MomentoSerializer(serializers.ModelSerializer):
    """Serializer para Momento."""
    autor = UsuarioSerializer(read_only=True)
    turma = TurmaSerializer(read_only=True)
    turma_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    alunos = AlunoSerializer(many=True, read_only=True)
    alunos_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
        allow_null=True
    )
    curtidas = CurtidaSerializer(many=True, read_only=True)
    comentarios = ComentarioSerializer(many=True, read_only=True)
    arquivo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Momento
        fields = [
            'id', 'autor', 'turma', 'turma_id', 'alunos', 'alunos_ids',
            'tipo', 'arquivo', 'arquivo_url', 'descricao', 'data_momento',
            'total_curtidas', 'total_comentarios', 'curtidas', 'comentarios',
            'data_criacao', 'data_atualizacao', 'escola'
        ]
        read_only_fields = [
            'id', 'autor', 'escola', 'data_criacao', 'data_atualizacao',
            'total_curtidas', 'total_comentarios'
        ]
    
    def get_arquivo_url(self, obj):
        """Retorna a URL completa do arquivo."""
        if obj.arquivo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.arquivo.url)
            return obj.arquivo.url
        return None
    
    def validate_arquivo(self, value):
        """Valida o arquivo de upload."""
        if value:
            validate_file_size(value)
            if self.initial_data.get('tipo') == 'FOTO':
                validate_image_file(value)
            elif self.initial_data.get('tipo') == 'VIDEO':
                validate_video_file(value)
        return value
    
    def validate(self, data):
        """Validações cruzadas."""
        # Valida que o autor é professor
        user = self.context.get('request').user
        if user.tipo_usuario != 'PROFESSOR':
            raise serializers.ValidationError(
                {'autor': 'Apenas professores podem criar momentos.'}
            )
        
        # Valida multi-tenancy
        if hasattr(user, 'escola') and user.escola:
            turma_id = data.get('turma_id') or (self.instance.turma.id if self.instance and self.instance.turma else None)
            if turma_id:
                try:
                    turma = Turma.objects.get(id=turma_id)
                    if turma.escola != user.escola:
                        raise serializers.ValidationError(
                            {'turma_id': 'A turma deve pertencer à sua escola.'}
                        )
                except Turma.DoesNotExist:
                    raise serializers.ValidationError(
                        {'turma_id': 'Turma não encontrada.'}
                    )
        
        return data


class ComunicadoSerializer(serializers.ModelSerializer):
    """Serializer para Comunicado."""
    autor = UsuarioSerializer(read_only=True)
    turma = TurmaSerializer(read_only=True)
    turma_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    curtidas = CurtidaSerializer(many=True, read_only=True)
    comentarios = ComentarioSerializer(many=True, read_only=True)
    
    class Meta:
        model = Comunicado
        fields = [
            'id', 'autor', 'turma', 'turma_id', 'titulo', 'conteudo',
            'data_publicacao', 'data_validade', 'prioridade',
            'total_curtidas', 'total_comentarios', 'curtidas', 'comentarios',
            'escola'
        ]
        read_only_fields = [
            'id', 'autor', 'escola', 'data_publicacao',
            'total_curtidas', 'total_comentarios'
        ]
    
    def validate(self, data):
        """Validações cruzadas."""
        user = self.context.get('request').user
        
        # Valida que o autor pode criar comunicados
        if user.tipo_usuario not in ['ADMIN_ESCOLA', 'PROFESSOR']:
            raise serializers.ValidationError(
                {'autor': 'Apenas administradores e professores podem criar comunicados.'}
            )
        
        # Valida multi-tenancy
        if hasattr(user, 'escola') and user.escola:
            turma_id = data.get('turma_id') or (self.instance.turma.id if self.instance and self.instance.turma else None)
            if turma_id:
                try:
                    turma = Turma.objects.get(id=turma_id)
                    if turma.escola != user.escola:
                        raise serializers.ValidationError(
                            {'turma_id': 'A turma deve pertencer à sua escola.'}
                        )
                except Turma.DoesNotExist:
                    raise serializers.ValidationError(
                        {'turma_id': 'Turma não encontrada.'}
                    )
        
        return data