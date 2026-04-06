#!/usr/bin/env bash
set -euo pipefail

python - <<'PY'
from pathlib import Path

path = Path("/opt/venv/lib/python3.12/site-packages/vllm/model_executor/layers/utils.py")
text = path.read_text()

needle = """    if layer.weight.is_meta:\n        layer.cpu_linear = torch.nn.functional.linear\n        return\n\n    N, K = layer.weight.size()\n"""
replacement = """    if layer.weight.is_meta:\n        layer.cpu_linear = torch.nn.functional.linear\n        return\n\n    if layer.weight.dim() != 2:\n        layer.cpu_linear = torch.nn.functional.linear\n        return\n\n    N, K = layer.weight.size()\n"""

if "if layer.weight.dim() != 2:" not in text:
    if needle not in text:
        raise SystemExit("Unable to patch vLLM CPU GEMM guard")
    path.write_text(text.replace(needle, replacement))
PY

exec vllm serve "$@"
