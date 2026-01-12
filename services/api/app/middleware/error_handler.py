import logging
from fastapi import Request
from fastapi.responses import JSONResponse


logger = logging.getLogger(__name__)


async def error_handler_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as exc:
        logger.exception("Unhandled error: %s", exc)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )
