from rest_framework import permissions
from apps.usuarios.models import Usuario

class IsAdminDaEscola(permissions.BasePermission):
    """
    Permite acesso apenas a usuários que são administradores de uma escola.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               request.user.tipo_usuario == Usuario.TipoUsuario.ADMIN_ESCOLA and \
               request.user.escola is not None

class IsProfessor(permissions.BasePermission):
    """
    Permite acesso apenas a usuários que são professores.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               request.user.tipo_usuario == Usuario.TipoUsuario.PROFESSOR and \
               request.user.escola is not None

class IsResponsavel(permissions.BasePermission):
    """
    Permite acesso apenas a usuários que são responsáveis.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               request.user.tipo_usuario == Usuario.TipoUsuario.RESPONSAVEL and \
               request.user.escola is not None

class IsAdminSistema(permissions.BasePermission):
    """
    Permite acesso apenas a usuários que são administradores do sistema (superusuários).
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               request.user.tipo_usuario == Usuario.TipoUsuario.ADMIN_SISTEMA