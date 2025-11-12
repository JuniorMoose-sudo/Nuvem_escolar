from django.db import models
from django.core.exceptions import ValidationError
from apps.academico.models import Aluno
from apps.core.models import Escola  # Importar Escola
import uuid

class AgendaDiaria(models.Model):
    """
    Registra a rotina diária de um aluno, preenchida pelo professor
    e visualizada pelo responsável.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Chave para Multi-tenancy (Correção de Auditoria)
    escola = models.ForeignKey(
        Escola,
        on_delete=models.CASCADE,
        related_name='agendas_diarias',
        null=True,
        blank=True
    )
    
    aluno = models.ForeignKey(
        Aluno, 
        on_delete=models.CASCADE, 
        related_name='agendas_diarias'
    )
    data = models.DateField()
    
    # JSONField para armazenar as atividades do dia de forma flexível.
    # Ex: [{"tipo": "Alimentação", "horario": "12:30", "observacao": "Comeu bem."}]
    atividades = models.JSONField(
        default=list,
        help_text="Lista de atividades diárias do aluno."
    )
    
    # Campo para observações gerais do professor
    observacoes_professor = models.TextField(blank=True, null=True)

    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Agenda Diária"
        verbose_name_plural = "Agendas Diárias"
        ordering = ['-data']
        # Garante que só existe uma agenda por aluno por dia.
        unique_together = ('aluno', 'data')

    def __str__(self):
        return f"Agenda de {self.aluno.nome_completo} em {self.data.strftime('%d/%m/%Y')}"

    def clean(self):
        # Validação para garantir que o JSONField seja uma lista
        if not isinstance(self.atividades, list):
            raise ValidationError({
                'atividades': 'O campo de atividades deve ser uma lista de objetos.'
            })
        # Validação de cada item da lista
        for item in self.atividades:
            if not all(k in item for k in ['tipo', 'horario', 'observacao']):
                raise ValidationError({
                    'atividades': 'Cada atividade deve conter "tipo", "horario" e "observacao".'
                })

    def save(self, *args, **kwargs):
        # Garante que a escola da agenda seja a mesma do aluno (Correção de Auditoria)
        if self.aluno and not self.escola_id:
            self.escola = self.aluno.escola
        super().save(*args, **kwargs)