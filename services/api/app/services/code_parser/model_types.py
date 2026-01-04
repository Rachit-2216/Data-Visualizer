from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class LayerNode:
    id: str
    name: str
    type: str
    params: Dict[str, str | int | float]
    input_shape: Optional[str] = None
    output_shape: Optional[str] = None
    activation: Optional[str] = None
    source_line: Optional[int] = None


@dataclass
class ParsedModel:
    layers: List[LayerNode]
    errors: List[str]
