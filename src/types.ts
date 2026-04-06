export const KINDS = ["ollama", "lmstudio", "llamacpp", "vllm"] as const

export type LocalProviderKind = (typeof KINDS)[number]

export type LocalModel = {
  id: string
  context: number
  toolcall: boolean
  vision: boolean
}
