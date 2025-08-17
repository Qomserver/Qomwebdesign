# syntax=docker/dockerfile:1.7-labs

FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1
WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
  && rm -rf /var/lib/apt/lists/*

# Install deps
COPY app/requirements.txt /app/requirements.txt
RUN pip install -r /app/requirements.txt

# Runtime image
FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1
WORKDIR /app

# Create non-root user
RUN useradd -m -u 10001 appuser

# Copy installed packages and source
COPY --from=base /usr/local /usr/local
COPY app /app

# Ensure runtime dirs
RUN mkdir -p /app/src/alembic/versions && chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

ENTRYPOINT ["/bin/bash", "-lc"]
CMD ["bash", "docker/entrypoint.sh"]