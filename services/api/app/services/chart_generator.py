from __future__ import annotations

from typing import Any


def build_basic_chart_spec(title: str, x_field: str, y_field: str, chart_type: str = "bar") -> dict[str, Any]:
    return {
        "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
        "description": title,
        "mark": chart_type,
        "encoding": {
            "x": {"field": x_field, "type": "nominal"},
            "y": {"field": y_field, "type": "quantitative"},
        },
    }
