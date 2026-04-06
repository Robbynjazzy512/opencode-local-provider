import type { LocalModel } from "../types"
import { authHeaders } from "../url"
import type { ProviderImpl } from "./shared"

async function detect(url: string, key?: string) {
  try {
    const res = await fetch(url, {
      headers: authHeaders(key),
      signal: AbortSignal.timeout(2000),
    })
    if (!res.ok) return false
    return res.headers.get("Server")?.toLowerCase() === "llama.cpp"
  } catch {
    return false
  }
}

async function probe(url: string, key?: string): Promise<LocalModel[]> {
  const res = await fetch(url + "/v1/models", {
    headers: authHeaders(key),
    signal: AbortSignal.timeout(3000),
  })
  if (!res.ok) throw new Error(`llama.cpp probe failed: ${res.status}`)
  const body = (await res.json()) as {
    data?: Array<{
      id: string
      meta?: Record<string, unknown> | null
    }>
  }

  return (body.data ?? []).map((item) => ({
    id: item.id,
    context: Number(item.meta?.n_ctx_train ?? item.meta?.n_ctx ?? 0),
    toolcall: false,
    vision: false,
  }))
}

const llamacpp: ProviderImpl = {
  detect,
  probe,
}

export default llamacpp
