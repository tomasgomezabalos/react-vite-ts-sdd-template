import type { Diagnostic, OutputFormat, Preview } from './types.ts'

const operationLabel = {
  create: 'CREAR',
  modify: 'MODIFICAR',
  delete: 'ELIMINAR',
  unchanged: 'SIN CAMBIOS',
} as const

export const formatPreview = (
  preview: Preview,
  format: OutputFormat,
): string => {
  const safe = {
    target: preview.target,
    token: preview.token,
    summary: Object.fromEntries(
      ['create', 'modify', 'delete', 'unchanged'].map((kind) => [
        kind,
        preview.operations.filter((operation) => operation.kind === kind)
          .length,
      ]),
    ),
    operations: preview.operations.map(
      ({ kind, path, beforeHash, afterHash }) => ({
        kind,
        path,
        beforeHash,
        afterHash,
      }),
    ),
    warnings: preview.warnings,
  }
  if (format === 'json') return JSON.stringify(safe, null, 2)
  const lines = [
    `Destino: ${preview.target}`,
    `Token de preview: ${preview.token}`,
    '',
    ...preview.operations.map(
      (operation) =>
        `${operationLabel[operation.kind].padEnd(12)} ${operation.path}`,
    ),
  ]
  if (preview.warnings.length > 0) {
    lines.push(
      '',
      'Advertencias:',
      ...preview.warnings.map((warning) => `- ${warning}`),
    )
  }
  return lines.join('\n')
}

export const formatApplyResult = (
  target: string,
  changed: number,
  format: OutputFormat,
): string => {
  const value = {
    target,
    status: changed === 0 ? 'UNCHANGED' : 'APPLIED',
    changed,
    nextSteps: [
      'Ejecutar template:doctor desde la plantilla contra este destino.',
      'Iniciar el descubrimiento SDD cuando exista una necesidad de producto real.',
      'Autorizar separadamente instalación, commit y publicación cuando proceda.',
    ],
  }
  if (format === 'json') return JSON.stringify(value, null, 2)
  return [
    changed === 0
      ? 'Inicialización ya aplicada; no hay cambios.'
      : `Inicialización aplicada: ${changed} operaciones.`,
    `Destino: ${target}`,
    '',
    'Siguientes pasos:',
    ...value.nextSteps.map((step) => `- ${step}`),
  ].join('\n')
}

export const formatRecovery = (
  target: string,
  id: string,
  format: OutputFormat,
): string => {
  const value = { target, transactionId: id, status: 'RECOVERED' }
  return format === 'json'
    ? JSON.stringify(value, null, 2)
    : `Transacción recuperada: ${id}\nDestino: ${target}`
}

export const formatDiagnostics = (
  target: string,
  diagnostics: Diagnostic[],
  format: OutputFormat,
): string => {
  const summary = Object.fromEntries(
    ['PASS', 'WARN', 'FAIL', 'UNKNOWN'].map((status) => [
      status,
      diagnostics.filter((diagnostic) => diagnostic.status === status).length,
    ]),
  )
  const value = {
    target,
    scope: 'technical-derivation',
    summary,
    diagnostics,
  }
  if (format === 'json') return JSON.stringify(value, null, 2)
  const lines = [
    `Destino: ${target}`,
    'Alcance: derivación técnica; no valida decisiones de producto.',
    `Resumen: ${Object.entries(summary)
      .map(([status, count]) => `${status}=${count}`)
      .join(' ')}`,
    '',
  ]
  for (const diagnostic of diagnostics) {
    lines.push(
      `[${diagnostic.status}] ${diagnostic.code}: ${diagnostic.message}${diagnostic.path ? ` (${diagnostic.path})` : ''}`,
    )
    if (diagnostic.limitation) lines.push(`  Límite: ${diagnostic.limitation}`)
  }
  return lines.join('\n')
}

export const formatError = (error: unknown, format: OutputFormat): string => {
  const message = error instanceof Error ? error.message : String(error)
  return format === 'json'
    ? JSON.stringify({ status: 'ERROR', message }, null, 2)
    : `ERROR: ${message}`
}
