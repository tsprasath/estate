from __future__ import absolute_import
import structlog

structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)


LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    'root': {
        'level': 'WARNING',
        'handlers': ['null'],
    },
    'formatters': {
        'simple': {
            'format': '%(message)s'
        },
        'verbose': {
            'format': '[%(levelname)s] %(name)s.%(funcName)s | %(message)s'
        },
    },
    'handlers': {
        'null': {
            'level': 'DEBUG',
            'class': 'logging.NullHandler',
        },
        'stdout': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'stream': 'ext://sys.stdout',
            'formatter': 'simple'
        },
        'stderr': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        }
    },
    'loggers': {
        'estate': {
            'level': 'INFO',
            'handlers': ['stdout'],
            'propagate': False,
        },
        'DockerHotExecutor': {
            'level': 'INFO',
            'handlers': ['stdout'],
            'propagate': False,
        },
        'DjangoCacheStreamer': {
            'level': 'INFO',
            'handlers': ['stdout'],
            'propagate': False,
        }
    }
}
