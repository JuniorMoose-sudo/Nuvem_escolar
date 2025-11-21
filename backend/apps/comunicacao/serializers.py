from rest_framework import serializers
from .models import (
    AgendaDiaria, Momento, Comunicado, Comentario, Curtida
)
from apps.academico.models import Aluno, Turma
from apps.academico.serializers import AlunoSerializer, TurmaSerializer
from apps.usuarios.serializers import UsuarioSerializer
from .validators import validate_file_size, validate_image_file, validate_video_file
from django.utils import timezone

class AtividadeSerializer(serializers.Serializer):
    """Serializer para validar a estrutura de cada atividade."""
    tipo = serializers.CharField(max_length=100)
    horario = serializers.CharField(max_length=5)
    observacao = serializers.CharField()

class AgendaDiariaSerializer(serializers.ModelSerializer):
    """
    Serializer para o modelo AgendaDiaria.
    """
    aluno = AlunoSerializer(read_only=True)
    aluno_id = serializers.UUIDField(write_only=True, source='aluno')
    atividades = AtividadeSerializer(many=True)

    class Meta:
        model = AgendaDiaria
        fields = [
            'id',
            'aluno',
            'aluno_id',
            'data',
            'atividades',
            'observacoes_professor',
            'data_criacao',
            'data_atualizacao',
            'escola', # Adicionado para consistência
        ]
        read_only_fields = ['id', 'data_criacao', 'data_atualizacao', 'escola']

    def validate_data(self, value):
        """ Impede que a agenda seja criada para uma data futura (Correção de Auditoria) """
        if value > timezone.now().date():
            raise serializers.ValidationError("Não é possível criar uma agenda para uma data futura.")
        return value

    def validate(self, data):
        """
        Validações cruzadas:
        1. Unicidade da agenda (aluno + data).
        2. Valida que o aluno pertence à escola do usuário (multi-tenancy).
        """
        aluno = data.get('aluno')
        data_agenda = data.get('data')

        # Validação de multi-tenancy: garante que o aluno pertence à escola do usuário
        if self.context.get('request'):
            user = self.context['request'].user
            if hasattr(user, 'escola') and user.escola:
                if aluno.escola != user.escola:
                    raise serializers.ValidationError(
                        {"aluno_id": "Este aluno não pertence à sua escola."}
                    )

        # Constrói o queryset para verificar a existência de duplicatas
        queryset = AgendaDiaria.objects.filter(aluno=aluno, data=data_agenda)

        # Se estiver atualizando, exclui o próprio objeto da verificação
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                {"data": "Este aluno já possui uma agenda para esta data."}
            )
            
        return data


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