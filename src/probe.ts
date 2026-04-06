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

export async function probe(url: string, key?: string) {
  const kind = await detect(url, key)
  if (!kind) throw new Error(`No supported local provider detected at: ${url}`)

  const root = rootURL(url)
  return {
    kind,
    models: await providers[kind].probe(root, key),
  }
}
