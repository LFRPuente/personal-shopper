import os
from datetime import timedelta
from pathlib import Path
from urllib.parse import unquote, urlparse

from django.core.exceptions import ImproperlyConfigured


BASE_DIR = Path(__file__).resolve().parent.parent


def env_bool(name, default=False):
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {'1', 'true', 'yes', 'on'}


def env_list(name, default=None):
    value = os.getenv(name)
    if value is None:
        return list(default or [])
    return [item.strip() for item in value.split(',') if item.strip()]


def build_postgres_config():
    database_url = os.getenv('DATABASE_URL', '').strip()
    if database_url:
        parsed = urlparse(database_url)
        if parsed.scheme not in {'postgres', 'postgresql', 'psql'}:
            raise ImproperlyConfigured('DATABASE_URL must use a PostgreSQL scheme.')

        name = unquote(parsed.path.lstrip('/'))
        if not name:
            raise ImproperlyConfigured('DATABASE_URL must include a database name.')

        return {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': name,
            'USER': unquote(parsed.username or ''),
            'PASSWORD': unquote(parsed.password or ''),
            'HOST': parsed.hostname or '',
            'PORT': str(parsed.port or 5432),
            'CONN_MAX_AGE': int(os.getenv('DB_CONN_MAX_AGE', '60')),
            'OPTIONS': {
                'connect_timeout': int(os.getenv('POSTGRES_CONNECT_TIMEOUT', '10')),
            },
        }

    required_vars = {
        'POSTGRES_DB': os.getenv('POSTGRES_DB', '').strip(),
        'POSTGRES_USER': os.getenv('POSTGRES_USER', '').strip(),
        'POSTGRES_PASSWORD': os.getenv('POSTGRES_PASSWORD', '').strip(),
        'POSTGRES_HOST': os.getenv('POSTGRES_HOST', '').strip(),
    }
    missing = [name for name, value in required_vars.items() if not value]
    if missing:
        raise ImproperlyConfigured(
            f"Missing PostgreSQL settings: {', '.join(missing)}"
        )

    return {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': required_vars['POSTGRES_DB'],
        'USER': required_vars['POSTGRES_USER'],
        'PASSWORD': required_vars['POSTGRES_PASSWORD'],
        'HOST': required_vars['POSTGRES_HOST'],
        'PORT': os.getenv('POSTGRES_PORT', '5432').strip() or '5432',
        'CONN_MAX_AGE': int(os.getenv('DB_CONN_MAX_AGE', '60')),
        'OPTIONS': {
            'connect_timeout': int(os.getenv('POSTGRES_CONNECT_TIMEOUT', '10')),
        },
    }


def build_database_config():
    db_engine = os.getenv('DB_ENGINE', 'sqlite').strip().lower()
    if db_engine == 'sqlite':
        sqlite_path = os.getenv('SQLITE_PATH', '').strip()
        return {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': sqlite_path or BASE_DIR / 'db.sqlite3',
        }
    if db_engine in {'postgres', 'postgresql'}:
        return build_postgres_config()
    raise ImproperlyConfigured(
        "DB_ENGINE must be 'sqlite' or 'postgres'."
    )


def build_channel_layers():
    channel_backend = os.getenv('CHANNEL_LAYER_BACKEND', 'inmemory').strip().lower()
    if channel_backend == 'inmemory':
        return {
            'default': {
                'BACKEND': 'channels.layers.InMemoryChannelLayer',
            }
        }

    if channel_backend == 'redis':
        redis_url = os.getenv('REDIS_URL', '').strip()
        if not redis_url:
            raise ImproperlyConfigured(
                'REDIS_URL is required when CHANNEL_LAYER_BACKEND=redis.'
            )
        return {
            'default': {
                'BACKEND': 'channels_redis.core.RedisChannelLayer',
                'CONFIG': {
                    'hosts': [redis_url],
                },
            }
        }

    raise ImproperlyConfigured(
        "CHANNEL_LAYER_BACKEND must be 'inmemory' or 'redis'."
    )


SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-testkey')
DEBUG = env_bool('DJANGO_DEBUG', True)

ALLOWED_HOSTS = env_list('DJANGO_ALLOWED_HOSTS', ['*'])
CSRF_TRUSTED_ORIGINS = env_list('DJANGO_CSRF_TRUSTED_ORIGINS', [])

# Trust proxy headers from tunnelmole so Django generates https:// URLs
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True

INSTALLED_APPS = [
    'daphne',
    'channels',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'api.middleware.UpdateLastActiveMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

ASGI_APPLICATION = 'backend.asgi.application'
WSGI_APPLICATION = 'backend.wsgi.application'

DATABASES = {
    'default': build_database_config(),
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = os.getenv('DJANGO_TIME_ZONE', 'UTC')
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CORS_ALLOW_ALL_ORIGINS = env_bool('CORS_ALLOW_ALL_ORIGINS', True)
if not CORS_ALLOW_ALL_ORIGINS:
    CORS_ALLOWED_ORIGINS = env_list('CORS_ALLOWED_ORIGINS', [])

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    )
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
}

CHANNEL_LAYERS = build_channel_layers()

FILE_UPLOAD_MAX_MEMORY_SIZE = 52428800
DATA_UPLOAD_MAX_MEMORY_SIZE = 52428800
