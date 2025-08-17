from fastapi import APIRouter, Response
from prometheus_client import CONTENT_TYPE_LATEST, CollectorRegistry, generate_latest
from prometheus_client import multiprocess  # type: ignore

router = APIRouter()


@router.get("/healthz")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/readyz")
def ready() -> dict[str, str]:
    return {"status": "ready"}


@router.get("/metrics")
def metrics() -> Response:
    registry = CollectorRegistry()
    try:
        multiprocess.MultiProcessCollector(registry)  # if using multi-process
    except Exception:
        pass
    data = generate_latest(registry)
    return Response(content=data, media_type=CONTENT_TYPE_LATEST)