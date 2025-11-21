#!/usr/bin/env python
"""
Script para criar usuários de teste.
Execute: python criar_usuario_teste.py
"""
import os
import sys
import django

# Adiciona o diretório do projeto ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configura o Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.core.models import Escola
from apps.usuarios.models import Usuario, PerfilProfessor, PerfilResponsavel

def criar_usuarios_teste():
    """Cria usuários de teste para login no mobile."""
    
    print("="*60)
    print("CRIANDO USUÁRIOS DE TESTE")
    print("="*60)
    
    # 1. Criar ou obter escola
    print("\n1. Verificando escola...")
    escola, created = Escola.objects.get_or_create(
        cnpj='12345678000190',
        defaults={
            'nome_fantasia': 'Escola Teste',
            'razao_social': 'Escola Teste LTDA',
            'email_contato': 'contato@escolateste.com',
            'telefone': '(11) 99999-9999',
            'cidade': 'São Paulo',
            'estado': 'SP',
        }
    )
    
    if created:
        print(f"   ✅ Escola criada: {escola.nome_fantasia}")
    else:
        print(f"   ✅ Escola já existe: {escola.nome_fantasia}")
    
    # 2. Criar usuário Admin da Escola
    print("\n2. Criando Administrador...")
    admin_email = 'admin@teste.com'
    admin_password = 'Teste@1234'
    
    admin_user, created = Usuario.objects.get_or_create(
        email=admin_email,
        defaults={
            'nome_completo': 'Administrador Teste',
            'tipo_usuario': Usuario.TipoUsuario.ADMIN_ESCOLA,
            'escola': escola,
            'is_active': True,
            'is_staff': True,
        }
    )
    
    if created:
        admin_user.set_password(admin_password)
        admin_user.save()
        print(f"   ✅ Admin criado")
    else:
        admin_user.set_password(admin_password)
        admin_user.save()
        print(f"   ✅ Admin atualizado")
    
    print(f"   📧 Email: {admin_email}")
    print(f"   🔑 Senha: {admin_password}")
    
    # 3. Criar usuário Professor
    print("\n3. Criando Professor...")
    professor_email = 'professor@teste.com'
    professor_password = 'Teste@1234'
    
    professor_user, created = Usuario.objects.get_or_create(
        email=professor_email,
        defaults={
            'nome_completo': 'Professor Teste',
            'tipo_usuario': Usuario.TipoUsuario.PROFESSOR,
            'escola': escola,
            'is_active': True,
        }
    )
    
    if created:
        professor_user.set_password(professor_password)
        professor_user.save()
        # Criar perfil de professor
        PerfilProfessor.objects.get_or_create(usuario=professor_user)
        print(f"   ✅ Professor criado")
    else:
        professor_user.set_password(professor_password)
        professor_user.save()
        print(f"   ✅ Professor atualizado")
    
    print(f"   📧 Email: {professor_email}")
    print(f"   🔑 Senha: {professor_password}")
    
    # 4. Criar usuário Responsável
    print("\n4. Criando Responsável...")
    responsavel_email = 'responsavel@teste.com'
    responsavel_password = 'Teste@1234'
    
    responsavel_user, created = Usuario.objects.get_or_create(
        email=responsavel_email,
        defaults={
            'nome_completo': 'Responsável Teste',
            'tipo_usuario': Usuario.TipoUsuario.RESPONSAVEL,
            'escola': escola,
            'is_active': True,
        }
    )
    
    if created:
        responsavel_user.set_password(responsavel_password)
        responsavel_user.save()
        # Criar perfil de responsável
        PerfilResponsavel.objects.get_or_create(usuario=responsavel_user)
        print(f"   ✅ Responsável criado")
    else:
        responsavel_user.set_password(responsavel_password)
        responsavel_user.save()
        print(f"   ✅ Responsável atualizado")
    
    print(f"   📧 Email: {responsavel_email}")
    print(f"   🔑 Senha: {responsavel_password}")
    
    print("\n" + "="*60)
    print("✅ USUÁRIOS DE TESTE CRIADOS COM SUCESSO!")
    print("="*60)
    print("\n📋 RESUMO:")
    print(f"\n👤 ADMINISTRADOR:")
    print(f"   Email: {admin_email}")
    print(f"   Senha: {admin_password}")
    print(f"\n👨‍🏫 PROFESSOR:")
    print(f"   Email: {professor_email}")
    print(f"   Senha: {professor_password}")
    print(f"\n👨‍👩‍👧 RESPONSÁVEL:")
    print(f"   Email: {responsavel_email}")
    print(f"   Senha: {responsavel_password}")
    print("\n" + "="*60)
    print("💡 Use qualquer um desses usuários para fazer login no mobile!")
    print("="*60 + "\n")

if __name__ == '__main__':
    criar_usuarios_teste()

