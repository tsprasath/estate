from __future__ import absolute_import
import logging
from copy import deepcopy
from django.core.cache import caches
from ..core.HotDockerExecutor import HotDockerExecutorStreamer

LOG = logging.getLogger("DjangoCacheStreamer")


class DjangoCacheStreamer(HotDockerExecutorStreamer):
    """
    Acts as a hook to stream the subprocess output for getting real-time
    process output. Sends the stream to a Django cache object.
    """

    def __init__(self, cache_name, cache_key, *args, **kwargs):
        super(DjangoCacheStreamer, self).__init__(*args, **kwargs)
        self.cache_name = cache_name
        self.cache_key = cache_key
        self.cache = caches[self.cache_name]
        self.initial_state = deepcopy(self.state)
        self.namespace_slug = self.cache_key.split("_")[1]

    def handle_log(self):
        self.set(self.state, None)

    def clear_cache(self):
        self.state = deepcopy(self.initial_state)
        self.set(self.initial_state, None)

    def get(self):
        return self.cache.get(self.cache_key)

    def set(self, value, ttl=None):
        self.cache.set(self.cache_key, value, ttl)
