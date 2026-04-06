import { describe, expect, test } from "bun:test"

import { detect, probe } from "../src/probe"
import { supportedProviderKinds } from "../src/providers"

const enabled = process.env.REAL_PROVIDER_SUITE === "1"
const selectedKind = process.env.PROVIDER_SUITE

const suites = [
  {
    kind: "ollama",
    url: process.env.OLLAMA_URL ?? "http://ollama:11434",
    modelID: process.env.OLLAMA_MODEL ?? "qwen2.5:0.5b",
  },
  {
    kind: "lmstudio",
    url: process.env.LMSTUDIO_URL ?? "http://lmstudio:1234",
    modelID: process.env.LMSTUDIO_MODEL_ID ?? "lmstudio-granite-micro",
  },
  {
    kind: "llamacpp",
    url: process.env.LLAMACPP_URL ?? "http://llamacpp:8080",
    modelID: process.env.LLAMACPP_MODEL_ID ?? "qwen2.5-0.5b-instruct",
  },
  {
    kind: "vllm",
    url: process.env.VLLM_URL ?? "http://vllm:8000",
    modelID: process.env.VLLM_MODEL ?? "LiquidAI/LFM2-350M",
  },
] as const

const activeSuites = selectedKind
  ? suites.filter((item) => item.kind === selectedKind)
  : suites

const describeIfEnabled = enabled ? describe : describe.skip

test("supported providers list stays in sync", () => {
  expect(supportedProviderKinds).toEqual(suites.map((item) => item.kind))
})

describeIfEnabled("real provider integration", () => {
  for (const item of activeSuites) {
    test(`${item.kind} detects and probes from root url`, async () => {
      expect(await detect(item.url)).toBe(item.kind)

      const result = await probe(item.url)
      expect(result.kind).toBe(item.kind)

      const model = result.models.find((entry) => entry.id === item.modelID)
      expect(model).toBeDefined()
      expect(model!.context).toBeGreaterThan(0)
      expect(typeof model!.toolcall).toBe("boolean")
      expect(typeof model!.vision).toBe("boolean")
    }, 120_000)

    test(`${item.kind} detects and probes from /v1 url`, async () => {
      expect(await detect(`${item.url}/v1`)).toBe(item.kind)

      const result = await probe(`${item.url}/v1`)
      expect(result.kind).toBe(item.kind)
      expect(result.models.some((entry) => entry.id === item.modelID)).toBe(true)
    }, 120_000)

    test(`${item.kind} probes when kind is supplied`, async () => {
      const result = await probe(item.url, undefined, item.kind)
      expect(result.kind).toBe(item.kind)
      expect(result.models.some((entry) => entry.id === item.modelID)).toBe(true)
    }, 120_000)
  }
})
