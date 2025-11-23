import requests
from django.conf import settings

FCM_ENDPOINT = 'https://fcm.googleapis.com/fcm/send'

def send_fcm_message(token, title, body, data=None):
    """Envia mensagem simples via FCM HTTP v1 legacy (server key).
    token: string device token
    data: dict opcional com payload adicional
    """
    server_key = getattr(settings, 'FCM_SERVER_KEY', None)
    if not server_key:
        raise RuntimeError('FCM_SERVER_KEY não configurado nas settings')

    headers = {
        'Authorization': f'key={server_key}',
        'Content-Type': 'application/json'
    }

    payload = {
        'to': token,
        'notification': {
            'title': title,
            'body': body,
        },
        'data': data or {}
    }

    resp = requests.post(FCM_ENDPOINT, json=payload, headers=headers, timeout=10)
    resp.raise_for_status()
    return resp.json()
