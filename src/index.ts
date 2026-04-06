import type { PluginModule } from "@opencode-ai/plugin"

import { LOCAL_PLUGIN_ID } from "./constants"
import { LocalProviderPlugin } from "./plugin"

export * from "./constants"
export * from "./plugin"
export * from "./probe"
export * from "./types"

const plugin: PluginModule = {
  id: LOCAL_PLUGIN_ID,
  server: LocalProviderPlugin,
}

export default plugin
