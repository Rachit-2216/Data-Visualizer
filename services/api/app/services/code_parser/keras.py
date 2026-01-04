import re
from typing import List, Optional
from .model_types import LayerNode, ParsedModel
from .pytorch import _split_args, _parse_number, _format_shape


KERAS_LAYERS = {
    "Dense": "Linear",
    "Conv2D": "Conv2d",
    "Flatten": "Flatten",
    "Dropout": "Dropout",
    "BatchNormalization": "BatchNorm",
    "ReLU": "ReLU",
    "Softmax": "Softmax",
    "Activation": "Activation",
}


def _build_dense(args: List[str], current_shape: Optional[List[object]]):
    units = _parse_number(args[0] if args else None)
    if units is not None:
        current_shape = [int(units)]
    return {"units": int(units) if units is not None else None}, current_shape


def _build_conv2d(args: List[str], current_shape: Optional[List[object]]):
    filters = _parse_number(args[0] if len(args) > 0 else None)
    kernel = _parse_number(args[1] if len(args) > 1 else None)
    params = {}
    if filters is not None:
        params["filters"] = int(filters)
    if kernel is not None:
        params["kernel"] = int(kernel)
    if filters is not None:
        current_shape = [int(filters), "H", "W"]
    return params, current_shape


def parse_keras(code: str, input_size: Optional[int] = None) -> ParsedModel:
    errors: List[str] = []
    layers: List[LayerNode] = []
    current_shape = [input_size] if input_size else None

    seq_match = re.search(r"Sequential\s*\(\s*\[(.*)\]\s*\)", code, re.DOTALL)
    entries: List[str] = []
    if seq_match:
        raw = seq_match.group(1)
        entries = [line.strip() for line in raw.split("\n") if line.strip() and not line.strip().startswith("#")]
    else:
        for line in code.splitlines():
            if "model.add" in line:
                entries.append(line.strip())

    for idx, line in enumerate(entries):
        match = re.search(r"([A-Za-z0-9_]+)\((.*)\)", line)
        if not match:
            continue
        raw = match.group(1)
        args = _split_args(match.group(2))
        layer_type = KERAS_LAYERS.get(raw, raw)
        params = {}
        activation = None
        input_shape = _format_shape(current_shape)

        if layer_type == "Linear":
            params, current_shape = _build_dense(args, current_shape)
        elif layer_type == "Conv2d":
            params, current_shape = _build_conv2d(args, current_shape)
        elif layer_type == "Dropout":
            prob = _parse_number(args[0] if args else None)
            if prob is not None:
                params["rate"] = float(prob)
        elif layer_type == "BatchNorm":
            pass
        elif layer_type == "Flatten":
            if current_shape and len(current_shape) > 1:
                acc = 1
                for item in current_shape:
                    try:
                        acc *= int(item)
                    except Exception:
                        pass
                current_shape = [acc or "N"]
        elif layer_type in ["ReLU", "Softmax"]:
            activation = layer_type
        elif layer_type == "Activation":
            activation = args[0].strip("'\"") if args else None

        layers.append(
            LayerNode(
                id=f"layer-{idx}",
                name=f"{raw}{idx + 1}",
                type=layer_type,
                params=params,
                input_shape=input_shape,
                output_shape=_format_shape(current_shape),
                activation=activation,
                source_line=idx + 1,
            )
        )

    if not layers:
        errors.append("No Keras Sequential layers found.")

    return ParsedModel(layers=layers, errors=errors)
