import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export function compareContracts(copyText: string, sourceText: string): boolean {
  return JSON.stringify(JSON.parse(copyText)) === JSON.stringify(JSON.parse(sourceText))
}

if (import.meta.main) {
  const copy = resolve(import.meta.dirname, '../contract/openapi.json')
  const source = resolve(import.meta.dirname, '../../sgen-auth-backend/docs/openapi.json')
  if (!existsSync(source)) {
    console.log(`Skipped: ${source} not found. Clone sgen-auth-backend next to this repo to compare.`)
  } else if (compareContracts(readFileSync(copy, 'utf8'), readFileSync(source, 'utf8'))) {
    console.log('contract/openapi.json matches sgen-auth-backend/docs/openapi.json.')
  } else {
    console.error(
      'contract/openapi.json differs from sgen-auth-backend/docs/openapi.json. Copy the backend file and update the client.',
    )
    process.exitCode = 1
  }
}
