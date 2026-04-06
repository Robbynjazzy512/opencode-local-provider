import type { LocalModel, LocalProviderKind } from "../types"

export type ProviderImpl = {
  detect(url: string, key?: string): Promise<boolean>
  probe(url: string, key?: string): Promise<LocalModel[]>
}

export type ProviderMap = Record<LocalProviderKind, ProviderImpl>
