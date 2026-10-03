import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadProjectConfig } from './config.ts'
import { buildPreview } from './managed-files.ts'
import {
  formatApplyResult,
  formatError,
  formatPreview,
  formatRecovery,
} from './output.ts'
import {
  assertNoPendingTransaction,
  assertProjectContext,
  loadBaselineManifest,
  resolveTarget,
} from './project.ts'
import { applyPreview, recoverTransaction } from './transaction.ts'
import type { OutputFormat } from './types.ts'

type InitArguments = {
  target?: string
  config?: string
  apply: boolean
  previewToken?: string
  recover?: string
  format: OutputFormat
  help: boolean
}

const usage = `Uso:
  npm run template:init -- --target <ruta> --config <ruta> [--format human|json]
  npm run template:init -- --target <ruta> --config <ruta> --apply --preview-token <sha256> [--format human|json]
  npm run template:init -- --target <ruta> --recover <id> [--format human|json]`

const parseArguments = (values: string[]): InitArguments => {
  const result: InitArguments = { apply: false, format: 'human', help: false }
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]
    if (value === undefined) break
    if (value === '--apply') result.apply = true
    else if (value === '--help' || value === '-h') result.help = true
    else if (
      [
        '--target',
        '--config',
        '--preview-token',
        '--recover',
        '--format',
      ].includes(value)
    ) {
      const next = values[index + 1]
      if (!next || next.startsWith('--'))
        throw new Error(`Falta el valor de ${value}.`)
      index += 1
      if (value === '--target') result.target = next
      else if (value === '--config') result.config = next
      else if (value === '--preview-token') result.previewToken = next
      else if (value === '--recover') result.recover = next
      else if (value === '--format') {
        if (next !== 'human' && next !== 'json')
          throw new Error('--format debe ser human o json.')
        result.format = next
      }
    } else throw new Error(`Argumento desconocido: ${value}`)
  }
  return result
}

export const runInit = async (values: string[]): Promise<number> => {
  let format: OutputFormat = 'human'
  try {
    const args = parseArguments(values)
    format = args.format
    if (args.help) {
      process.stdout.write(`${usage}\n`)
      return 0
    }
    if (!args.target) throw new Error('--target es obligatorio.')
    const target = await resolveTarget(args.target)
    if (args.recover) {
      if (args.config || args.apply || args.previewToken) {
        throw new Error(
          '--recover no puede combinarse con configuración, aplicación o token.',
        )
      }
      await recoverTransaction(target, args.recover)
      process.stdout.write(`${formatRecovery(target, args.recover, format)}\n`)
      return 0
    }
    if (!args.config) throw new Error('--config es obligatorio.')
    if (args.previewToken && !args.apply) {
      throw new Error('--preview-token solo es válido junto con --apply.')
    }
    if (args.apply && !args.previewToken) {
      throw new Error('--apply requiere --preview-token.')
    }

    await assertNoPendingTransaction(target)
    const config = await loadProjectConfig(resolve(args.config))
    const manifest = await loadBaselineManifest()
    await assertProjectContext(target, config, manifest)
    const preview = await buildPreview(target, config, manifest)
    if (!args.apply) {
      process.stdout.write(`${formatPreview(preview, format)}\n`)
      return 0
    }
    if (args.previewToken !== preview.token) {
      throw new Error(
        'El token no coincide: repita la previsualización sobre el estado actual.',
      )
    }
    const applied = await applyPreview(preview)
    process.stdout.write(
      `${formatApplyResult(target, applied.changed, format)}\n`,
    )
    return 0
  } catch (error) {
    process.stderr.write(`${formatError(error, format)}\n`)
    return 2
  }
}

const isMain = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href === import.meta.url
  : false

if (isMain) process.exitCode = await runInit(process.argv.slice(2))
