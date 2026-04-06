#!/usr/bin/env bash
set -euo pipefail

exec /app/llama-server \
  -hf "$LLAMACPP_MODEL_REPO" \
  --host 0.0.0.0 \
  --port 8080 \
  --ctx-size "$LLAMACPP_CONTEXT" \
