#!/usr/bin/env bash
set -euo pipefail

ROOT="$(dirname "$0")/../.."
COMPOSE_FILE="$ROOT/tests/docker/compose.providers.yml"
SUITE="${1:-all}"
SERVICES=(ollama lmstudio llamacpp vllm)

is_valid_suite() {
  local candidate="$1"

  if [[ "$candidate" == "all" ]]; then
    return 0
  fi

  for service in "${SERVICES[@]}"; do
    if [[ "$service" == "$candidate" ]]; then
      return 0
    fi
  done

  return 1
}

if ! is_valid_suite "$SUITE"; then
  printf 'Unknown provider suite: %s\n' "$SUITE" >&2
  printf 'Expected one of: all, %s\n' "${SERVICES[*]}" >&2
  exit 1
fi

cleanup() {
  docker compose -f "$COMPOSE_FILE" down >/dev/null 2>&1 || true
}

trap cleanup EXIT INT TERM

if [[ "$SUITE" == "all" ]]; then
  docker compose -f "$COMPOSE_FILE" up -d --wait
else
  docker compose -f "$COMPOSE_FILE" up -d --wait "$SUITE"
fi

REAL_PROVIDER_SUITE=1 \
PROVIDER_SUITE="$([[ "$SUITE" == "all" ]] && printf '' || printf '%s' "$SUITE")" \
OLLAMA_URL="http://127.0.0.1:11434" \
OLLAMA_MODEL="${OLLAMA_MODEL:-qwen2.5:0.5b}" \
LMSTUDIO_URL="http://127.0.0.1:1234" \
LMSTUDIO_MODEL_ID="${LMSTUDIO_MODEL_ID:-lmstudio-granite-micro}" \
LLAMACPP_URL="http://127.0.0.1:8080" \
LLAMACPP_MODEL_ID="${LLAMACPP_MODEL_ID:-qwen2.5-0.5b-instruct}" \
VLLM_URL="http://127.0.0.1:8000" \
  VLLM_MODEL="${VLLM_MODEL:-LiquidAI/LFM2-350M}" \
  bun test "$ROOT/tests/providers.real.test.ts"
