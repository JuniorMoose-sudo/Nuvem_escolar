from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, PerfilProfessor, PerfilResponsavel, PushToken
from apps.core.models import Escola

# Registro do modelo Escola (do app core)
@admin.register(Escola)
class EscolaAdmin(admin.ModelAdmin):
    list_display = ('nome_fantasia', 'cnpj', 'email_contato', 'cidade', 'ativo')
    search_fields = ('nome_fantasia', 'cnpj', 'razao_social')
    list_filter = ('ativo', 'estado')

# Registro do modelo Usuario
class PerfilProfessorInline(admin.StackedInline):
    model = PerfilProfessor
    can_delete = False
    verbose_name_plural = 'Perfil de Professor'

class PerfilResponsavelInline(admin.StackedInline):
    model = PerfilResponsavel
    can_delete = False
    verbose_name_plural = 'Perfil de Responsável'

@admin.register(Usuario)
class CustomUsuarioAdmin(UserAdmin):
    # Usa o UserAdmin padrão, mas adaptado para nosso modelo
    model = Usuario
    
    # Campos para listagem
    list_display = ('email', 'nome_completo', 'escola', 'tipo_usuario', 'is_staff', 'is_active')
    list_filter = ('tipo_usuario', 'is_staff', 'is_active', 'escola__nome_fantasia')
    
    # Campos para busca
    search_fields = ('email', 'nome_completo', 'escola__nome_fantasia')
    ordering = ('email',)
    
    # Campos no formulário de edição
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informações Pessoais', {'fields': ('nome_completo',)}),
        ('Vínculos', {'fields': ('escola', 'tipo_usuario')}),
        ('Permissões', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Datas Importantes', {'fields': ('last_login', 'date_joined')}),
    )
    
    # Campos no formulário de criação
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password', 'password2', 'nome_completo', 'escola', 'tipo_usuario'),
        }),
    )
    
    filter_horizontal = ('groups', 'user_permissions',)
    
    # Inlines apenas na edição, não na criação
    def get_inlines(self, request, obj):
        if obj:  # Se estiver editando (obj existe)
            # Retorna inlines baseado no tipo de usuário
            inlines = []
            if obj.tipo_usuario == Usuario.TipoUsuario.PROFESSOR:
                inlines.append(PerfilProfessorInline)
            elif obj.tipo_usuario == Usuario.TipoUsuario.RESPONSAVEL:
                inlines.append(PerfilResponsavelInline)
            return inlines
        return []  # Não mostra inlines na criação

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        is_superuser = request.user.is_superuser
        # Permite que superusuários editem o campo 'escola'
        if not is_superuser:
            form.base_fields['escola'].disabled = True
        return form
    
    def save_model(self, request, obj, form, change):
        """Override para criar perfis automaticamente após salvar."""
        super().save_model(request, obj, form, change)
        
        # Cria perfil automaticamente baseado no tipo de usuário
        if not change:  # Apenas na criação
            if obj.tipo_usuario == Usuario.TipoUsuario.PROFESSOR:
                PerfilProfessor.objects.get_or_create(usuario=obj)
            elif obj.tipo_usuario == Usuario.TipoUsuario.RESPONSAVEL:
                PerfilResponsavel.objects.get_or_create(usuario=obj)

# Registro dos perfis (opcional, pois já estão inline no Usuario)
@admin.register(PerfilProfessor)
class PerfilProfessorAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'get_escola')
    search_fields = ('usuario__nome_completo', 'usuario__email')
    
    @admin.display(description='Escola')
    def get_escola(self, obj):
        return obj.usuario.escola

@admin.register(PerfilResponsavel)
class PerfilResponsavelAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'get_escola')
    search_fields = ('usuario__nome_completo', 'usuario__email')
    
    @admin.display(description='Escola')
    def get_escola(self, obj):
        return obj.usuario.escola


@admin.register(PushToken)
class PushTokenAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'plataforma', 'token', 'escola', 'atualizado_em')
    search_fields = ('usuario__email', 'token')
    list_filter = ('plataforma', 'escola')
    readonly_fields = ('criado_em', 'atualizado_em')