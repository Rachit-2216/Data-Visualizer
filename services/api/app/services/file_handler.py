from __future__ import annotations

from typing import Optional


def infer_file_type(filename: str | None, content_type: str | None) -> Optional[str]:
    if filename:
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext in {"csv", "json", "parquet", "tsv", "xlsx"}:
            return ext
        if ext in {"xls"}:
            return "xlsx"
    if content_type:
        lowered = content_type.lower()
        if "csv" in lowered:
            return "csv"
        if "json" in lowered:
            return "json"
        if "parquet" in lowered:
            return "parquet"
        if "spreadsheet" in lowered or "excel" in lowered:
            return "xlsx"
        if "tab-separated-values" in lowered or "tsv" in lowered:
            return "tsv"
    return None
