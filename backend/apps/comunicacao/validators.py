"""
Validadores customizados para upload de arquivos.
"""
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def validate_file_size(file):
    """
    Valida o tamanho máximo do arquivo (10MB).
    """
    max_size = 10 * 1024 * 1024  # 10MB em bytes
    if file.size > max_size:
        raise ValidationError(
            _('O arquivo é muito grande. Tamanho máximo permitido: 10MB.')
        )


def validate_image_file(file):
    """
    Valida se o arquivo é uma imagem válida.
    """
    valid_extensions = ['.jpg', '.jpeg', '.png', '.gif']
    ext = file.name.split('.')[-1].lower()
    if f'.{ext}' not in valid_extensions:
        raise ValidationError(
            _('Formato de imagem inválido. Use: JPG, PNG ou GIF.')
        )


def validate_video_file(file):
    """
    Valida se o arquivo é um vídeo válido.
    """
    valid_extensions = ['.mp4', '.mov', '.avi']
    ext = file.name.split('.')[-1].lower()
    if f'.{ext}' not in valid_extensions:
        raise ValidationError(
            _('Formato de vídeo inválido. Use: MP4, MOV ou AVI.')
        )

