import type { LocalProviderKind } from "./types"

import { order, providers } from "./providers"
import { rootURL } from "./url"

export async function detect(url: string, key?: string): Promise<LocalProviderKind | null> {
  const root = rootURL(url)

  for (const kind of order) {
    if (await providers[kind].detect(root, key)) return kind
  }

  return null
}

export async function probe(url: string, key?: string, kind?: LocalProviderKind) {
  const root = rootURL(url)

  if (kind) {
    return {
      kind,
      models: await providers[kind].probe(root, key),
    }
  }

  const detected = await detect(url, key)
  if (!detected) throw new Error(`No supported local provider detected at: ${url}`)

  return {
    kind: detected,
    models: await providers[detected].probe(root, key),
  }
}
