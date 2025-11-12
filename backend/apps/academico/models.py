import uuid
from django.db import models
from apps.core.models import Escola
from apps.usuarios.models import PerfilProfessor, PerfilResponsavel

class Turma(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    escola = models.ForeignKey(Escola, on_delete=models.CASCADE, related_name='turmas')
    nome = models.CharField(max_length=100)
    ano_letivo = models.IntegerField()
    professor_principal = models.ForeignKey(
        PerfilProfessor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='turmas_principal'
    )

    class Meta:
        verbose_name = "Turma"
        verbose_name_plural = "Turmas"
        unique_together = ('escola', 'nome', 'ano_letivo')

    def __str__(self):
        return f'{self.nome} - {self.ano_letivo}'

class Materia(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    escola = models.ForeignKey(Escola, on_delete=models.CASCADE, related_name='materias')
    nome = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Matéria"
        verbose_name_plural = "Matérias"
        unique_together = ('escola', 'nome')

    def __str__(self):
        return self.nome

class Aluno(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    escola = models.ForeignKey(Escola, on_delete=models.CASCADE, related_name='alunos')
    nome_completo = models.CharField(max_length=255)
    matricula = models.CharField(max_length=50, unique=True)
    turma = models.ForeignKey(
        Turma,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='alunos'
    )

    class Meta:
        verbose_name = "Aluno"
        verbose_name_plural = "Alunos"

    def __str__(self):
        return self.nome_completo

class ProfessorTurma(models.Model):
    """Vínculo de um professor a uma turma e matéria específica."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    professor = models.ForeignKey(PerfilProfessor, on_delete=models.CASCADE, related_name='vinculos_turmas')
    turma = models.ForeignKey(Turma, on_delete=models.CASCADE, related_name='vinculos_professores')
    materia = models.ForeignKey(Materia, on_delete=models.SET_NULL, null=True, blank=True, related_name='vinculos_professores')

    class Meta:
        verbose_name = "Vínculo Professor-Turma"
        unique_together = ('professor', 'turma', 'materia')

class ResponsavelAluno(models.Model):
    """Vínculo entre um responsável e um aluno."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    responsavel = models.ForeignKey(PerfilResponsavel, on_delete=models.CASCADE, related_name='vinculos_alunos')
    aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE, related_name='vinculos_responsaveis')
    PARENTESCO_CHOICES = [
        ('PAI', 'Pai'),
        ('MAE', 'Mãe'),
        ('AVO', 'Avô/Avó'),
        ('OUTRO', 'Outro')
    ]
    parentesco = models.CharField(max_length=10, choices=PARENTESCO_CHOICES, default='OUTRO')
    responsavel_principal = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Vínculo Responsável-Aluno"
        unique_together = ('responsavel', 'aluno')
