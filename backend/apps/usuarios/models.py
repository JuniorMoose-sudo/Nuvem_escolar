from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from apps.core.models import Escola

class CustomUsuarioManager(BaseUserManager):
    """
    Manager customizado para o modelo Usuario, usando email como
    identificador principal.
    """
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('O Email é obrigatório'))
        email = self.normalize_email(email)
        
        # Garante que a escola seja passada para usuários normais
        escola = extra_fields.get('escola')
        if not escola:
            raise ValueError(_('A Escola é obrigatória para o usuário'))
        if not isinstance(escola, Escola):
            raise TypeError(_('escola deve ser uma instância de Escola'))

        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('tipo_usuario', Usuario.TipoUsuario.ADMIN_SISTEMA)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
            
        # Superusuário do sistema (nível Nuvem Escolar) não pertence a uma escola específica
        extra_fields.pop('escola', None)

        # Remove a obrigatoriedade de escola para o superuser do sistema
        if not email:
            raise ValueError(_('O Email é obrigatório'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class Usuario(AbstractUser):
    """
    Modelo de usuário customizado herdando de AbstractUser.
    Remove 'username' e usa 'email' como campo principal.
    Implementa multi-tenancy com FK para Escola.
    """
    class TipoUsuario(models.TextChoices):
        ADMIN_SISTEMA = 'ADMIN_SISTEMA', _('Admin do Sistema')
        ADMIN_ESCOLA = 'ADMIN_ESCOLA', _('Admin da Escola')
        PROFESSOR = 'PROFESSOR', _('Professor')
        RESPONSAVEL = 'RESPONSAVEL', _('Responsável')

    # Remove username, first_name, last_name
    username = None
    first_name = None
    last_name = None

    nome_completo = models.CharField(max_length=255, verbose_name="Nome Completo")
    email = models.EmailField(_('email address'), unique=True)
    
    # Chave para Multi-tenancy
    # Superusuários (Admin Sistema) podem não ter escola
    escola = models.ForeignKey(
        Escola, 
        on_delete=models.PROTECT, 
        related_name='usuarios', 
        null=True, 
        blank=True
    )
    
    tipo_usuario = models.CharField(
        max_length=15,
        choices=TipoUsuario.choices,
        default=TipoUsuario.RESPONSAVEL
    )
    
    data_atualizacao = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nome_completo']

    objects = CustomUsuarioManager()

    def __str__(self):
        return self.email

    class Meta:
        verbose_name = "Usuário"
        verbose_name_plural = "Usuários"


class PerfilProfessor(models.Model):
    """
    Dados adicionais para usuários do tipo Professor.
    """
    usuario = models.OneToOneField(
        Usuario, 
        on_delete=models.CASCADE, 
        primary_key=True, 
        related_name='perfil_professor'
    )
    # Relacionamentos com Turmas e Matérias serão adicionados na Sprint 2
    
    def __str__(self):
        return f"Professor: {self.usuario.nome_completo}"

    class Meta:
        verbose_name = "Perfil (Professor)"
        verbose_name_plural = "Perfis (Professores)"

class PerfilResponsavel(models.Model):
    """
    Dados adicionais para usuários do tipo Responsável.
    """
    usuario = models.OneToOneField(
        Usuario, 
        on_delete=models.CASCADE, 
        primary_key=True, 
        related_name='perfil_responsavel'
    )
    # Relacionamentos com Alunos (filhos) serão adicionados na Sprint 2

    def __str__(self):
        return f"Responsável: {self.usuario.nome_completo}"

    class Meta:
        verbose_name = "Perfil (Responsável)"
        verbose_name_plural = "Perfis (Responsáveis)"