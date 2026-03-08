import { defineConfig } from 'prisma/config'
import { readFileSync } from 'fs'
import { join } from 'path'

function loadEnv(filePath: string): Record<string, string> {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const result: Record<string, string> = {}
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex === -1) continue
      const key = trimmed.slice(0, eqIndex).trim()
      const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, '')
      result[key] = value
    }
    return result
  } catch {
    return {}
  }
}

const localEnv = loadEnv(join(process.cwd(), '.env.local'))
const databaseUrl = localEnv.DATABASE_URL ?? process.env.DATABASE_URL

export default defineConfig({
  datasource: {
    url: databaseUrl as string,
  },
})
