import type { Plugin, ProviderHookContext } from "@opencode-ai/plugin"
import type { Provider } from "@opencode-ai/sdk/v2"

import {
  LOCAL_PROVIDER_ID,
  LOCAL_PROVIDER_NAME,
  LOCAL_PLUGIN_SERVICE,
  OPENAI_COMPATIBLE_NPM,
} from "./constants"
import { authKey, providerURL, save } from "./config"
import { build } from "./models"
import { probe } from "./probe"
import { baseURL, trimURL } from "./url"

function valid(value: string) {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

async function models(provider: Provider, ctx: ProviderHookContext) {
  const url = providerURL(provider)
  if (!url) return {}

  try {
    const found = await probe(url, authKey(ctx.auth))
    return build(provider.id, url, found.models, provider.models)
  } catch {
    return {}
  }
}

export const LocalProviderPlugin: Plugin = async (ctx) => {
  await ctx.client.app.log({
    body: {
      service: LOCAL_PLUGIN_SERVICE,
      level: "info",
      message: "Local Provider plugin loaded",
    },
  })

  return {
    config: async (cfg) => {
      cfg.provider ??= {}
      const provider = cfg.provider[LOCAL_PROVIDER_ID] ?? {}
      cfg.provider[LOCAL_PROVIDER_ID] = {
        ...provider,
        name: provider.name ?? LOCAL_PROVIDER_NAME,
        npm: provider.npm ?? OPENAI_COMPATIBLE_NPM,
        options: {
          ...provider.options,
          baseURL:
            typeof provider.options?.baseURL === "string" && provider.options.baseURL
              ? baseURL(provider.options.baseURL)
              : provider.options?.baseURL,
        },
      }
    },
    auth: {
      provider: LOCAL_PROVIDER_ID,
      methods: [
        {
          type: "api",
          label: "Connect to Local Provider",
          prompts: [
            {
              type: "text",
              key: "baseURL",
              message: "Enter your local provider URL",
              placeholder: "http://localhost:11434",
              validate(value) {
                if (!value) return "URL is required"
                if (!valid(value)) return "Please enter a valid URL (e.g. http://localhost:11434)"
              },
            },
            {
              type: "text",
              key: "apiKey",
              message: "API key (leave empty if not needed)",
              placeholder: "Bearer token or empty",
            },
          ],
          async authorize(input = {}) {
            const raw = trimURL(input.baseURL ?? "")
            if (!raw || !valid(raw)) return { type: "failed" as const }

            const key = input.apiKey?.trim() ?? ""

            try {
              await probe(raw, key)
              await save(ctx.client, raw)
              return {
                type: "success" as const,
                key,
                provider: LOCAL_PROVIDER_ID,
              }
            } catch {
              return { type: "failed" as const }
            }
          },
        },
      ],
    },
    provider: {
      id: LOCAL_PROVIDER_ID,
      models,
    },
  }
}
