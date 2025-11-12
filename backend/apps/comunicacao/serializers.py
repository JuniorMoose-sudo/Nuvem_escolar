from rest_framework import serializers
from .models import AgendaDiaria
from apps.academico.models import Aluno
from apps.academico.serializers import AlunoSerializer
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
        """
        aluno = data.get('aluno')
        data_agenda = data.get('data')

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