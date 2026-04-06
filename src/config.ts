import type { PluginInput } from "@opencode-ai/plugin"
import { createOpencodeClient } from "@opencode-ai/sdk/v2/client"
import type { Provider } from "@opencode-ai/sdk/v2"

import { LEGACY_TARGET_ID, LOCAL_PROVIDER_ID } from "./constants"
import type { LocalTarget } from "./types"
import { baseURL } from "./url"

function sdk(url: URL, input: PluginInput["client"]) {
  const cfg = (((input as unknown) as { _client?: { getConfig?: () => { fetch?: typeof fetch; headers?: Record<string, string> } } })._client?.getConfig?.() ?? {}) as {
    fetch?: typeof fetch
    headers?: Record<string, string>
  }

  return createOpencodeClient({
    baseUrl: url.toString(),
    fetch: cfg.fetch,
    headers: cfg.headers,
    throwOnError: true,
  })
}

export function authKey(auth?: { type: string; key?: string }) {
  if (!auth || auth.type !== "api") return ""
  return auth.key ?? ""
}

function target(item: unknown) {
  if (typeof item === "string" && item) return { url: baseURL(item) }
  if (item && typeof item === "object") {
    const url = "url" in item ? item.url : undefined
    if (typeof url === "string" && url) return { url: baseURL(url) }
  }
}

export function targets(provider?: Pick<Provider, "options">) {
  const raw = provider?.options?.targets
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const next = Object.fromEntries(
      Object.entries(raw)
        .map(([id, item]) => {
          const val = target(item)
          if (!val) return
          return [id, val] as const
        })
        .filter((item): item is readonly [string, LocalTarget] => Boolean(item)),
    )
    if (Object.keys(next).length) return next
  }

  const url = provider?.options?.baseURL
  if (typeof url === "string" && url) {
    return {
      [LEGACY_TARGET_ID]: {
        url: baseURL(url),
      },
    }
  }

  return {}
}

export function key(provider?: Pick<Provider, "options">, auth?: { type: string; key?: string }) {
  const val = provider?.options?.apiKey
  if (typeof val === "string" && val) return val
  return authKey(auth)
}

export async function current(url: URL, input: PluginInput["client"]) {
  const cfg = await sdk(url, input).global.config.get()
  const provider = cfg.data?.provider?.[LOCAL_PROVIDER_ID]
  return {
    targets: targets(provider as Pick<Provider, "options"> | undefined),
    key: typeof provider?.options?.apiKey === "string" ? provider.options.apiKey : "",
  }
}

export async function save(server: URL, input: PluginInput["client"], id: string, url: string, key?: string) {
  const cur = await current(server, input)
  const options: Record<string, unknown> = {
    targets: {
      ...cur.targets,
      [id]: {
        url: baseURL(url),
      },
    },
  }

  if (key !== undefined) options.apiKey = key

  await sdk(server, input).global.config.update({
    config: {
      provider: {
        [LOCAL_PROVIDER_ID]: {
          options,
        },
      },
    },
  })
}
