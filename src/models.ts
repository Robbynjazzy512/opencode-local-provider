import type { Model } from "@opencode-ai/sdk/v2"

import { DEFAULT_CONTEXT, DEFAULT_OUTPUT, OPENAI_COMPATIBLE_NPM } from "./constants"
import type { LocalModel } from "./types"
import { baseURL } from "./url"

function limits(input: number) {
  const context = input > 0 ? input : DEFAULT_CONTEXT
  return {
    context,
    output: Math.min(context, DEFAULT_OUTPUT),
  }
}

function id(target: string, model: string) {
  return `${target}/${model}`
}

function name(target: string, model: string) {
  return `${model} (${target})`
}

function item(providerID: string, target: string, url: string, model: LocalModel, prev?: Model): Model {
  const limit = limits(model.context)
  const next = id(target, model.id)

  return {
    id: next,
    providerID,
    api: {
      id: model.id,
      url: baseURL(url),
      npm: prev?.api.npm ?? OPENAI_COMPATIBLE_NPM,
    },
    name: prev?.name ?? name(target, model.id),
    family: prev?.family ?? "",
    capabilities: {
      temperature: prev?.capabilities.temperature ?? true,
      reasoning: prev?.capabilities.reasoning ?? false,
      attachment: model.vision,
      toolcall: model.toolcall,
      input: {
        text: true,
        audio: false,
        image: model.vision,
        video: false,
        pdf: false,
      },
      output: {
        text: true,
        audio: false,
        image: false,
        video: false,
        pdf: false,
      },
      interleaved: prev?.capabilities.interleaved ?? false,
    },
    cost: {
      input: 0,
      output: 0,
      cache: {
        read: 0,
        write: 0,
      },
    },
    limit,
    status: prev?.status ?? "active",
    options: {
      ...prev?.options,
      target,
    },
    headers: prev?.headers ?? {},
    release_date: prev?.release_date ?? "",
    variants: prev?.variants ?? {},
  }
}

export function build(providerID: string, target: string, url: string, list: LocalModel[], prev: Record<string, Model>) {
  return Object.fromEntries(
    list.map((model) => {
      const key = id(target, model.id)
      return [key, item(providerID, target, url, model, prev[key])]
    }),
  )
}
