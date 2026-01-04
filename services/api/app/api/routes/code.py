from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.core.auth import get_current_user
from app.services.code_parser.pytorch import parse_sequential, parse_functional
from app.services.code_parser.keras import parse_keras

router = APIRouter()


class CodeParseRequest(BaseModel):
    code: str
    framework: str = "pytorch"
    api_style: str = "sequential"
    input_size: int | None = None


@router.post("/code/parse")
def parse_code(request: CodeParseRequest, user=Depends(get_current_user)):
    if request.framework.lower() == "keras":
        parsed = parse_keras(request.code, request.input_size)
    else:
        if request.api_style == "functional":
            parsed = parse_functional(request.code, request.input_size)
        else:
            parsed = parse_sequential(request.code, request.input_size)

    return {
        "layers": [layer.__dict__ for layer in parsed.layers],
        "errors": parsed.errors,
    }
