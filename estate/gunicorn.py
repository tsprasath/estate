import os
import multiprocessing

addr = os.environ.get("GUNICORN_BIND_ADDRESS", "0.0.0.0")
port = os.environ.get("GUNICORN_BIND_PORT", "8000")
bind = "{0}:{1}".format(addr, port)
workers = os.environ.get("GUNICORN_WORKER_COUNT") or multiprocessing.cpu_count() * 10 + 1
worker_class = os.environ.get("GUNICORN_WORKER_CLASS", "gevent")
loglevel = os.environ.get("GUNICORN_LOG_LEVEL", "info")
timeout = 0
accesslog = "-"
