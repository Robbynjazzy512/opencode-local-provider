import type { PluginInput } from "@opencode-ai/plugin"
import type { Provider } from "@opencode-ai/sdk/v2"

import { LOCAL_PROVIDER_ID } from "./constants"
import { baseURL } from "./url"

export function providerURL(provider?: Pick<Provider, "options">) {
  const url = provider?.options?.baseURL
  if (typeof url !== "string" || !url) return ""
  return baseURL(url)
}

export function authKey(auth?: { type: string; key?: string }) {
  if (!auth || auth.type !== "api") return ""
  return auth.key ?? ""
}

export async function save(client: PluginInput["client"], url: string) {
  await client.config.update({
    body: {
      provider: {
        [LOCAL_PROVIDER_ID]: {
          options: {
            baseURL: baseURL(url),
          },
        },
      },
    },
  })
}
