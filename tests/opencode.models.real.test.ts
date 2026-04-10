import { describe, expect, test } from "bun:test"
import { randomUUID } from "node:crypto"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL("..", import.meta.url))
const composeFile = fileURLToPath(new URL("./docker/compose.providers.yml", import.meta.url))

function run(command: string, args: string[], env: Record<string, string>) {
  const result = spawnSync(command, args, {
    cwd: root,
    env: {
      ...process.env,
      ...env,
    },
    encoding: "utf8",
  })

  if (result.status === 0) return result.stdout

  throw new Error(
    [`Command failed: ${command} ${args.join(" ")}`, result.stdout.trim(), result.stderr.trim()]
      .filter(Boolean)
      .join("\n\n"),
  )
}

describe("opencode docker integration", () => {
  test("lists the default llama.cpp model after plugin install", () => {
    const env = {
      COMPOSE_PROJECT_NAME: `opencode-models-${randomUUID().slice(0, 8)}`,
    }

    try {
      run("bun", ["run", "build"], env)

      run("docker", ["compose", "-f", composeFile, "up", "-d", "--wait", "llamacpp", "opencode"], env)

      const output = run(
        "docker",
        [
          "compose",
          "-f",
          composeFile,
          "exec",
          "-T",
          "opencode",
          "sh",
          "-lc",
          [
            "export HOME=/tmp/opencode-home",
            "mkdir -p \"$HOME\" /tmp/opencode-test",
            "cd /tmp/opencode-test",
            "opencode plugin /workspace",
            "opencode models",
          ].join(" && "),
        ],
        env,
      )

      expect(output).toContain("llamacpp/")
      expect(output).toContain("LFM2.5-350M")
    } finally {
      spawnSync("docker", ["compose", "-f", composeFile, "down", "-v"], {
        cwd: root,
        env: {
          ...process.env,
          ...env,
        },
        encoding: "utf8",
      })
    }
  }, 600_000)
})
