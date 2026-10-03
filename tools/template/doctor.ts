import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { loadProjectConfig } from './config.ts'
import { runDiagnostics } from './diagnostics.ts'
import { formatDiagnostics, formatError } from './output.ts'
import { loadBaselineManifest, resolveTarget } from './project.ts'
import type { OutputFormat } from './types.ts'

type DoctorArguments = {
  target?: string
  config?: string
  format: OutputFormat
  help: boolean
}

const usage = `Uso:
  npm run template:doctor -- --target <ruta> --config <ruta> [--format human|json]`

const parseArguments = (values: string[]): DoctorArguments => {
  const result: DoctorArguments = { format: 'human', help: false }
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index]
    if (value === '--help' || value === '-h') result.help = true
    else if (
      value === '--target' ||
      value === '--config' ||
      value === '--format'
    ) {
      const next = values[index + 1]
      if (!next || next.startsWith('--'))
        throw new Error(`Falta el valor de ${value}.`)
      index += 1
      if (value === '--target') result.target = next
      else if (value === '--config') result.config = next
      else {
        if (next !== 'human' && next !== 'json')
          throw new Error('--format debe ser human o json.')
        result.format = next
      }
    } else throw new Error(`Argumento desconocido: ${value}`)
  }
  return result
}

export const runDoctor = async (values: string[]): Promise<number> => {
  let format: OutputFormat = 'human'
  try {
    const args = parseArguments(values)
    format = args.format
    if (args.help) {
      process.stdout.write(`${usage}\n`)
      return 0
    }
    if (!args.target) throw new Error('--target es obligatorio.')
    if (!args.config) throw new Error('--config es obligatorio.')
    const target = await resolveTarget(args.target)
    const config = await loadProjectConfig(resolve(args.config))
    const manifest = await loadBaselineManifest()
    const diagnostics = await runDiagnostics(target, config, manifest)
    process.stdout.write(`${formatDiagnostics(target, diagnostics, format)}\n`)
    return diagnostics.some((diagnostic) => diagnostic.status === 'FAIL')
      ? 1
      : 0
  } catch (error) {
    process.stderr.write(`${formatError(error, format)}\n`)
    return 2
  }
}

const isMain = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href === import.meta.url
  : false

if (isMain) process.exitCode = await runDoctor(process.argv.slice(2))
