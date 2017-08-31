from __future__ import absolute_import
import os
from .base import INSTALLED_APPS, PROJECT_ROOT, DEBUG

INSTALLED_APPS += [
    'webpack_loader',
]

WEBPACK_LOADER = {
    'DEFAULT': {
        'CACHE': not DEBUG,
        'BUNDLE_DIR_NAME': 'bundles/',  # must end with slash
        'STATS_FILE': os.path.join(PROJECT_ROOT, 'assets', 'webpack-stats.json'),
        'IGNORE': ['.+\.hot-update.js', '.+\.map']
    }
}
