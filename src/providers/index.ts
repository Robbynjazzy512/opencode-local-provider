import type { LocalProviderKind } from "../types"

import llamacpp from "./llamacpp"
import lmstudio from "./lmstudio"
import ollama from "./ollama"
import type { ProviderMap } from "./shared"
import vllm from "./vllm"

export const order: LocalProviderKind[] = ["ollama", "lmstudio", "llamacpp", "vllm"]

export const providers: ProviderMap = {
  ollama,
  lmstudio,
  llamacpp,
  vllm,
}
