from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from apps.academico.models import Aluno, Turma
from apps.core.models import Escola
from apps.usuarios.models import Usuario
import uuid
import os

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


# ============================================================================
# SPRINT 4 - Feed de Momentos e Comunicação
# ============================================================================

def upload_momento_path(instance, filename):
    """
    Define o caminho de upload para arquivos de momentos.
    Estrutura: momentos/{escola_id}/{ano}/{mes}/{filename}
    """
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return f"momentos/{instance.escola.id}/{filename}"


class Momento(models.Model):
    """
    Modelo para compartilhar fotos/vídeos de atividades escolares.
    Professores podem postar para suas turmas.
    Responsáveis visualizam posts dos seus filhos.
    """
    TIPO_CHOICES = [
        ('FOTO', 'Foto'),
        ('VIDEO', 'Vídeo'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Multi-tenancy
    escola = models.ForeignKey(
        Escola,
        on_delete=models.CASCADE,
        related_name='momentos',
        null=True,
        blank=True
    )
    
    # Autor do post (professor)
    autor = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='momentos_criados',
        limit_choices_to={'tipo_usuario': Usuario.TipoUsuario.PROFESSOR}
    )
    
    # Turma para a qual o momento é direcionado
    turma = models.ForeignKey(
        Turma,
        on_delete=models.CASCADE,
        related_name='momentos',
        null=True,
        blank=True
    )
    
    # Alunos específicos mencionados no momento (opcional)
    alunos = models.ManyToManyField(
        Aluno,
        related_name='momentos',
        blank=True
    )
    
    # Tipo de mídia
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES, default='FOTO')
    
    # Arquivo de mídia
    arquivo = models.FileField(
        upload_to=upload_momento_path,
        validators=[
            FileExtensionValidator(
                allowed_extensions=['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi']
            )
        ],
        help_text="Formatos aceitos: JPG, PNG, GIF, MP4, MOV, AVI. Tamanho máximo: 10MB"
    )
    
    # Descrição/legenda do momento
    descricao = models.TextField(blank=True, null=True)
    
    # Data do momento (quando a foto/vídeo foi tirado)
    data_momento = models.DateField(help_text="Data em que o momento ocorreu")
    
    # Metadados
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)
    
    # Contadores (otimização)
    total_curtidas = models.IntegerField(default=0)
    total_comentarios = models.IntegerField(default=0)
    
    class Meta:
        verbose_name = "Momento"
        verbose_name_plural = "Momentos"
        ordering = ['-data_momento', '-data_criacao']
        indexes = [
            models.Index(fields=['escola', '-data_criacao']),
            models.Index(fields=['turma', '-data_criacao']),
        ]
    
    def __str__(self):
        return f"Momento de {self.autor.nome_completo} - {self.data_momento}"
    
    def clean(self):
        """Validações adicionais."""
        from .validators import validate_file_size
        
        # Valida que o autor é professor
        if self.autor and self.autor.tipo_usuario != Usuario.TipoUsuario.PROFESSOR:
            raise ValidationError({'autor': 'Apenas professores podem criar momentos.'})
        
        # Valida tamanho do arquivo
        if self.arquivo:
            try:
                validate_file_size(self.arquivo)
            except ValidationError as e:
                raise ValidationError({'arquivo': str(e)})
        
        # Valida que turma e alunos pertencem à mesma escola
        if self.turma and self.escola and self.turma.escola != self.escola:
            raise ValidationError({'turma': 'A turma deve pertencer à mesma escola.'})
    
    def save(self, *args, **kwargs):
        # Garante que a escola seja a mesma do autor
        if self.autor and not self.escola_id:
            self.escola = self.autor.escola
        # Garante que a escola seja a mesma da turma
        if self.turma and not self.escola_id:
            self.escola = self.turma.escola
        super().save(*args, **kwargs)


class Comunicado(models.Model):
    """
    Modelo para comunicados gerais da escola ou turma.
    Professores e admins podem criar.
    Responsáveis visualizam comunicados das turmas dos seus filhos.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Multi-tenancy
    escola = models.ForeignKey(
        Escola,
        on_delete=models.CASCADE,
        related_name='comunicados',
        null=True,
        blank=True
    )
    
    # Autor do comunicado
    autor = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='comunicados_criados',
        limit_choices_to={
            'tipo_usuario__in': [
                Usuario.TipoUsuario.ADMIN_ESCOLA,
                Usuario.TipoUsuario.PROFESSOR
            ]
        }
    )
    
    # Turma específica (opcional - se None, é comunicado geral da escola)
    turma = models.ForeignKey(
        Turma,
        on_delete=models.CASCADE,
        related_name='comunicados',
        null=True,
        blank=True
    )
    
    # Título e conteúdo
    titulo = models.CharField(max_length=255)
    conteudo = models.TextField()
    
    # Data de publicação e validade
    data_publicacao = models.DateTimeField(auto_now_add=True)
    data_validade = models.DateField(null=True, blank=True, help_text="Data até quando o comunicado é válido")
    
    # Prioridade (para destacar)
    prioridade = models.CharField(
        max_length=10,
        choices=[
            ('BAIXA', 'Baixa'),
            ('NORMAL', 'Normal'),
            ('ALTA', 'Alta'),
            ('URGENTE', 'Urgente'),
        ],
        default='NORMAL'
    )
    
    # Contadores
    total_curtidas = models.IntegerField(default=0)
    total_comentarios = models.IntegerField(default=0)
    
    class Meta:
        verbose_name = "Comunicado"
        verbose_name_plural = "Comunicados"
        ordering = ['-prioridade', '-data_publicacao']
        indexes = [
            models.Index(fields=['escola', '-data_publicacao']),
            models.Index(fields=['turma', '-data_publicacao']),
        ]
    
    def __str__(self):
        return f"{self.titulo} - {self.escola}"
    
    def save(self, *args, **kwargs):
        # Garante que a escola seja a mesma do autor
        if self.autor and not self.escola_id:
            self.escola = self.autor.escola
        # Garante que a escola seja a mesma da turma
        if self.turma and not self.escola_id:
            self.escola = self.turma.escola
        super().save(*args, **kwargs)


class Curtida(models.Model):
    """
    Modelo para curtidas em Momentos e Comunicados.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Usuário que curtiu
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='curtidas'
    )
    
    # Conteúdo curtido (Generic Foreign Key seria ideal, mas vamos usar FKs separadas)
    momento = models.ForeignKey(
        Momento,
        on_delete=models.CASCADE,
        related_name='curtidas',
        null=True,
        blank=True
    )
    
    comunicado = models.ForeignKey(
        Comunicado,
        on_delete=models.CASCADE,
        related_name='curtidas',
        null=True,
        blank=True
    )
    
    data_criacao = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Curtida"
        verbose_name_plural = "Curtidas"
        unique_together = [
            ('usuario', 'momento'),
            ('usuario', 'comunicado'),
        ]
        indexes = [
            models.Index(fields=['momento', '-data_criacao']),
            models.Index(fields=['comunicado', '-data_criacao']),
        ]
    
    def __str__(self):
        if self.momento:
            return f"{self.usuario.nome_completo} curtiu momento {self.momento.id}"
        return f"{self.usuario.nome_completo} curtiu comunicado {self.comunicado.id}"
    
    def clean(self):
        """Valida que apenas um dos campos (momento ou comunicado) está preenchido."""
        if not (self.momento or self.comunicado):
            raise ValidationError('É necessário informar um momento ou comunicado.')
        if self.momento and self.comunicado:
            raise ValidationError('Não é possível curtir momento e comunicado ao mesmo tempo.')
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
        # Atualiza contador
        if self.momento:
            self.momento.total_curtidas = self.momento.curtidas.count()
            self.momento.save(update_fields=['total_curtidas'])
        elif self.comunicado:
            self.comunicado.total_curtidas = self.comunicado.curtidas.count()
            self.comunicado.save(update_fields=['total_curtidas'])


class Comentario(models.Model):
    """
    Modelo para comentários em Momentos e Comunicados.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Usuário que comentou
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name='comentarios'
    )
    
    # Conteúdo comentado
    momento = models.ForeignKey(
        Momento,
        on_delete=models.CASCADE,
        related_name='comentarios',
        null=True,
        blank=True
    )
    
    comunicado = models.ForeignKey(
        Comunicado,
        on_delete=models.CASCADE,
        related_name='comentarios',
        null=True,
        blank=True
    )
    
    # Comentário pai (para respostas)
    comentario_pai = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        related_name='respostas',
        null=True,
        blank=True
    )
    
    # Conteúdo do comentário
    texto = models.TextField(max_length=1000)
    
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Comentário"
        verbose_name_plural = "Comentários"
        ordering = ['data_criacao']
        indexes = [
            models.Index(fields=['momento', 'data_criacao']),
            models.Index(fields=['comunicado', 'data_criacao']),
        ]
    
    def __str__(self):
        preview = self.texto[:50] + '...' if len(self.texto) > 50 else self.texto
        return f"Comentário de {self.usuario.nome_completo}: {preview}"
    
    def clean(self):
        """Valida que apenas um dos campos (momento ou comunicado) está preenchido."""
        if not (self.momento or self.comunicado):
            raise ValidationError('É necessário informar um momento ou comunicado.')
        if self.momento and self.comunicado:
            raise ValidationError('Não é possível comentar em momento e comunicado ao mesmo tempo.')
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
        # Atualiza contador
        if self.momento:
            self.momento.total_comentarios = self.momento.comentarios.count()
            self.momento.save(update_fields=['total_comentarios'])
        elif self.comunicado:
            self.comunicado.total_comentarios = self.comunicado.comentarios.count()
            self.comunicado.save(update_fields=['total_comentarios'])