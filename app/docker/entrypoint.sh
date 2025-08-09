#!/usr/bin/env bash
set -euo pipefail

# Wait for DB if DATABASE_URL points to a service
python - <<'PY'
import os, time
from urllib.parse import urlparse
import socket

url = os.environ.get('DATABASE_URL', '')
if url:
    parsed = urlparse(url)
    host = parsed.hostname
    port = parsed.port or 5432
    if host not in (None, 'localhost', '127.0.0.1'):
        for _ in range(60):
            try:
                with socket.create_connection((host, port), timeout=1):
                    break
            except OSError:
                time.sleep(1)
PY

alembic -c app/alembic.ini upgrade head
exec gunicorn 'src.main:create_app()' -k uvicorn.workers.UvicornWorker -c app/gunicorn_conf.py