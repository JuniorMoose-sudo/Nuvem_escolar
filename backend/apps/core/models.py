from django.db import models
import uuid

class Escola(models.Model):
    """
    Modelo central para Multi-tenancy.
    Todas as entidades principais terão FK para Escola.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nome_fantasia = models.CharField(max_length=255, verbose_name="Nome Fantasia")
    razao_social = models.CharField(max_length=255, verbose_name="Razão Social")
    cnpj = models.CharField(max_length=18, unique=True, verbose_name="CNPJ")
    
    
    # Contato
    email_contato = models.EmailField(max_length=255, verbose_name="E-mail de Contato")
    telefone = models.CharField(max_length=20, blank=True, null=True, verbose_name="Telefone")
    
    # Endereço
    endereco = models.CharField(max_length=255, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=2, blank=True, null=True, verbose_name="UF")
    cep = models.CharField(max_length=10, blank=True, null=True, verbose_name="CEP")

    data_criacao = models.DateTimeField(auto_now_add=True, verbose_name="Data de Criação")
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.nome_fantasia

    class Meta:
        verbose_name = "Escola"
        verbose_name_plural = "Escolas"