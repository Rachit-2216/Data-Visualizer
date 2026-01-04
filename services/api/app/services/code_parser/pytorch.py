import re
from typing import Dict, List, Optional
from .model_types import LayerNode, ParsedModel


def _split_args(args: str) -> List[str]:
    parts: List[str] = []
    depth = 0
    current = ""
    for ch in args:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth = max(0, depth - 1)
        if ch == "," and depth == 0:
            parts.append(current.strip())
            current = ""
            continue
        current += ch
    if current.strip():
        parts.append(current.strip())
    return parts


def _parse_number(value: Optional[str]) -> Optional[float]:
    if not value:
        return None
    cleaned = re.sub(r"[^0-9\.\-]", "", value)
    try:
        return float(cleaned)
    except ValueError:
        return None


def _format_shape(shape: Optional[List[object]]) -> Optional[str]:
    if not shape:
        return None
    return "[" + ", ".join(str(item) for item in shape) + "]"


def _normalize_layer(raw: str) -> str:
    mapping = {
        "BatchNorm1d": "BatchNorm",
        "BatchNorm2d": "BatchNorm",
    }
    return mapping.get(raw, raw)


def _build_layer(
    raw_type: str,
    args: List[str],
    current_shape: Optional[List[object]],
    index: int,
    line_no: int,
) -> tuple[LayerNode, Optional[List[object]]]:
    layer_type = _normalize_layer(raw_type)
    params: Dict[str, str | int | float] = {}
    activation = None
    input_shape = _format_shape(current_shape)

    if layer_type == "Linear":
        in_features = _parse_number(args[0] if len(args) > 0 else None)
        out_features = _parse_number(args[1] if len(args) > 1 else None)
        if in_features is not None:
            params["in_features"] = int(in_features)
        if out_features is not None:
            params["out_features"] = int(out_features)
        if out_features is not None:
            current_shape = [int(out_features)]
    elif layer_type == "Conv2d":
        in_channels = _parse_number(args[0] if len(args) > 0 else None)
        out_channels = _parse_number(args[1] if len(args) > 1 else None)
        kernel = _parse_number(args[2] if len(args) > 2 else None)
        stride = _parse_number(args[3] if len(args) > 3 else None) or 1
        padding = _parse_number(args[4] if len(args) > 4 else None) or 0
        if in_channels is not None:
            params["in_channels"] = int(in_channels)
        if out_channels is not None:
            params["out_channels"] = int(out_channels)
        if kernel is not None:
            params["kernel"] = int(kernel)
        params["stride"] = int(stride)
        params["padding"] = int(padding)
        if out_channels is not None:
            current_shape = [int(out_channels), "H", "W"]
    elif layer_type == "LSTM":
        input_size = _parse_number(args[0] if len(args) > 0 else None)
        hidden_size = _parse_number(args[1] if len(args) > 1 else None)
        if input_size is not None:
            params["input_size"] = int(input_size)
        if hidden_size is not None:
            params["hidden_size"] = int(hidden_size)
        if hidden_size is not None:
            current_shape = [int(hidden_size)]
    elif layer_type == "Dropout":
        prob = _parse_number(args[0] if len(args) > 0 else None)
        if prob is not None:
            params["p"] = float(prob)
    elif layer_type == "BatchNorm":
        features = _parse_number(args[0] if len(args) > 0 else None)
        if features is not None:
            params["features"] = int(features)
    elif layer_type == "Flatten":
        if current_shape and len(current_shape) > 1:
            acc = 1
            for item in current_shape:
                try:
                    acc *= int(item)
                except Exception:
                    pass
            current_shape = [acc or "N"]
    elif layer_type in ["ReLU", "Sigmoid", "Softmax", "Tanh", "GELU", "LeakyReLU"]:
        activation = layer_type

    node = LayerNode(
        id=f"layer-{index}",
        name=f"{raw_type}{index + 1}",
        type=layer_type,
        params=params,
        input_shape=input_shape,
        output_shape=_format_shape(current_shape),
        activation=activation,
        source_line=line_no,
    )
    return node, current_shape


def parse_sequential(code: str, input_size: Optional[int] = None) -> ParsedModel:
    errors: List[str] = []
    layers: List[LayerNode] = []

    match = re.search(r"nn\.Sequential\s*\(([\s\S]*?)\)\s*", code, re.MULTILINE)
    if not match:
        return ParsedModel(layers=[], errors=["No nn.Sequential block found."])

    body = match.group(1)
    lines = [line.strip() for line in body.split("\n") if line.strip() and not line.strip().startswith("#")]

    current_shape = [input_size] if input_size else None
    for idx, line in enumerate(lines):
        layer_match = re.search(r"nn\.([A-Za-z0-9_]+)\((.*)\)\s*,?", line)
        if not layer_match:
            continue
        raw_type = layer_match.group(1)
        args = _split_args(layer_match.group(2))
        node, current_shape = _build_layer(raw_type, args, current_shape, idx, idx + 1)
        layers.append(node)

    if not layers:
        errors.append("No layers parsed in nn.Sequential block.")

    return ParsedModel(layers=layers, errors=errors)


def parse_functional(code: str, input_size: Optional[int] = None) -> ParsedModel:
    errors: List[str] = []
    module_defs: Dict[str, tuple[str, List[str], int]] = {}
    lines = code.splitlines()

    for idx, line in enumerate(lines):
        match = re.search(r"self\.([A-Za-z0-9_]+)\s*=\s*nn\.([A-Za-z0-9_]+)\((.*)\)", line)
        if match:
            name = match.group(1)
            layer_type = match.group(2)
            args = _split_args(match.group(3))
            module_defs[name] = (layer_type, args, idx + 1)

    order: List[str] = []
    in_forward = False
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("def forward"):
            in_forward = True
            continue
        if in_forward and stripped.startswith("def "):
            break
        if not in_forward:
            continue
        call_match = re.search(r"self\.([A-Za-z0-9_]+)\(", stripped)
        if call_match:
            name = call_match.group(1)
            if name in module_defs:
                order.append(name)

    if not module_defs:
        return ParsedModel(layers=[], errors=["No PyTorch modules found in class."])

    if not order:
        order = list(module_defs.keys())

    current_shape = [input_size] if input_size else None
    layers: List[LayerNode] = []
    for idx, name in enumerate(order):
        layer_type, args, line_no = module_defs[name]
        node, current_shape = _build_layer(layer_type, args, current_shape, idx, line_no)
        node.name = name
        layers.append(node)

    return ParsedModel(layers=layers, errors=errors)
