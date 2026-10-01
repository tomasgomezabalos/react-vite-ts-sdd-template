import { randomUUID } from 'node:crypto'
import {
  chmod,
  mkdir,
  readFile,
  rename,
  rm,
  rmdir,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises'
import { dirname, relative, resolve } from 'node:path'
import { hashText } from './config.ts'
import {
  ProjectError,
  pathExists,
  readProjectFile,
  resolveSafePath,
} from './project.ts'
import type {
  FileOperation,
  Preview,
  TransactionJournal,
} from './types.ts'

type ApplyOptions = {
  failAfter?: number
}

const transactionDirectory = (target: string, id: string) =>
  resolve(target, '.template-transaction', id)

const journalPath = (target: string, id: string) =>
  resolve(transactionDirectory(target, id), 'journal.json')

const writeJournal = async (
  target: string,
  journal: TransactionJournal,
) => {
  const path = journalPath(target, journal.id)
  const temporary = `${path}.tmp`
  await writeFile(temporary, `${JSON.stringify(journal, null, 2)}\n`, { mode: 0o600 })
  await rename(temporary, path)
}

const assertCurrentHash = async (
  target: string,
  operation: FileOperation,
) => {
  const current = await readProjectFile(target, operation.path)
  if ((current?.hash ?? null) !== operation.beforeHash) {
    throw new ProjectError(
      `El archivo cambió después del preview y no se aplicará: ${operation.path}`,
    )
  }
}

const writeReplacement = async (
  target: string,
  operation: FileOperation,
  stagedPath: string,
) => {
  const destination = await resolveSafePath(target, operation.path)
  await mkdir(dirname(destination), { recursive: true })
  await rename(stagedPath, destination)
  await chmod(destination, operation.mode)
}

const removeEmptyParents = async (target: string, path: string) => {
  let current = dirname(path)
  while (current !== target && current.startsWith(`${target}/`)) {
    try {
      await rmdir(current)
      current = dirname(current)
    } catch {
      return
    }
  }
}

const restoreOperation = async (
  target: string,
  transactionRoot: string,
  operation: TransactionJournal['operations'][number],
) => {
  const destination = await resolveSafePath(target, operation.path)
  const current = await readProjectFile(target, operation.path)
  const currentHash = current?.hash ?? null
  if (currentHash === operation.beforeHash) return
  if (currentHash !== operation.afterHash) {
    throw new ProjectError(
      `No se recuperará ${operation.path} porque cambió después de la transacción.`,
    )
  }
  if (operation.beforeHash === null) {
    await unlink(destination)
    await removeEmptyParents(target, destination)
    return
  }
  if (!operation.backupPath) {
    throw new ProjectError(`Falta la copia de seguridad de ${operation.path}.`)
  }
  const backup = resolve(transactionRoot, operation.backupPath)
  if (!relative(transactionRoot, backup) || relative(transactionRoot, backup).startsWith('..')) {
    throw new ProjectError(`Ruta de backup inválida para ${operation.path}.`)
  }
  const backupContent = await readFile(backup)
  if (hashText(backupContent.toString('utf8')) !== operation.beforeHash) {
    throw new ProjectError(`La copia de seguridad de ${operation.path} no coincide con el diario.`)
  }
  await mkdir(dirname(destination), { recursive: true })
  const temporary = `${destination}.template-recover-${operation.path.replaceAll('/', '-')}`
  await writeFile(temporary, backupContent, { mode: operation.mode })
  await rename(temporary, destination)
  await chmod(destination, operation.mode)
}

const rollback = async (
  target: string,
  journal: TransactionJournal,
) => {
  journal.status = 'rolling-back'
  await writeJournal(target, journal)
  const root = transactionDirectory(target, journal.id)
  for (const operation of [...journal.operations].reverse()) {
    await restoreOperation(target, root, operation)
  }
}

const cleanTransaction = async (target: string, id: string) => {
  await rm(transactionDirectory(target, id), { recursive: true, force: true })
  try {
    await rmdir(resolve(target, '.template-transaction'))
  } catch {
    // Se conserva la raíz si contiene otra transacción o ya no existe.
  }
}

export const applyPreview = async (
  preview: Preview,
  options: ApplyOptions = {},
): Promise<{ transactionId: string | null; changed: number }> => {
  const changes = preview.operations
    .filter((operation) => operation.kind !== 'unchanged')
    .sort((left, right) => {
      if (left.path === '.template-state.json') return 1
      if (right.path === '.template-state.json') return -1
      return left.path.localeCompare(right.path)
    })
  for (const operation of preview.operations) await assertCurrentHash(preview.target, operation)
  if (changes.length === 0) return { transactionId: null, changed: 0 }

  const id = randomUUID()
  await resolveSafePath(preview.target, '.template-transaction')
  const root = transactionDirectory(preview.target, id)
  await mkdir(resolve(root, 'backup'), { recursive: true, mode: 0o700 })
  await mkdir(resolve(root, 'staged'), { recursive: true, mode: 0o700 })

  const journal: TransactionJournal = {
    schemaVersion: 1,
    id,
    target: preview.target,
    status: 'prepared',
    operations: changes.map((operation) => ({
      path: operation.path,
      kind: operation.kind as Exclude<FileOperation['kind'], 'unchanged'>,
      beforeHash: operation.beforeHash,
      afterHash: operation.afterHash,
      mode: operation.mode,
      backupPath: operation.beforeHash === null ? null : `backup/${operation.path}`,
      applied: false,
    })),
  }
  await writeJournal(preview.target, journal)
  try {
    for (const operation of journal.operations) {
      if (operation.backupPath) {
        const currentPath = await resolveSafePath(preview.target, operation.path)
        const backup = resolve(root, operation.backupPath)
        await mkdir(dirname(backup), { recursive: true })
        await writeFile(backup, await readFile(currentPath), { mode: 0o600 })
      }
      const previewOperation = changes.find((candidate) => candidate.path === operation.path)
      if (previewOperation?.content !== undefined) {
        const staged = resolve(root, 'staged', operation.path)
        await mkdir(dirname(staged), { recursive: true })
        await writeFile(staged, previewOperation.content, { mode: operation.mode })
      }
    }
  } catch (error) {
    await cleanTransaction(preview.target, id)
    throw new ProjectError(
      `No se pudo preparar la transacción; no se modificaron archivos gestionados: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
  journal.status = 'applying'
  await writeJournal(preview.target, journal)

  try {
    for (const [index, operation] of changes.entries()) {
      if (options.failAfter === index) throw new Error(`Fallo inyectado tras ${index} operaciones.`)
      const destination = await resolveSafePath(preview.target, operation.path)
      if (operation.kind === 'delete') {
        await unlink(destination)
        await removeEmptyParents(preview.target, destination)
      } else {
        await writeReplacement(
          preview.target,
          operation,
          resolve(root, 'staged', operation.path),
        )
      }
      journal.operations[index].applied = true
      await writeJournal(preview.target, journal)
    }
    await cleanTransaction(preview.target, id)
    return { transactionId: id, changed: changes.length }
  } catch (error) {
    try {
      await rollback(preview.target, journal)
      await cleanTransaction(preview.target, id)
    } catch (rollbackError) {
      throw new ProjectError(
        `La aplicación falló y la recuperación automática también: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}. Transacción: ${id}.`,
      )
    }
    throw new ProjectError(
      `La aplicación falló y se revirtió: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

export const recoverTransaction = async (
  target: string,
  id: string,
): Promise<void> => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new ProjectError('Identificador de transacción inválido.')
  await resolveSafePath(target, `.template-transaction/${id}/journal.json`)
  let journal: TransactionJournal
  try {
    journal = JSON.parse(await readFile(journalPath(target, id), 'utf8')) as TransactionJournal
  } catch {
    throw new ProjectError(`No se puede leer la transacción ${id}.`)
  }
  if (journal.schemaVersion !== 1 || journal.id !== id || journal.target !== target) {
    throw new ProjectError(`El diario de la transacción ${id} no es válido para este destino.`)
  }
  await rollback(target, journal)
  await cleanTransaction(target, id)
}

export const readTransactionMode = async (target: string, id: string): Promise<number> => {
  const details = await stat(transactionDirectory(target, id))
  return details.mode & 0o777
}

export const hasTransaction = async (target: string, id: string): Promise<boolean> =>
  pathExists(transactionDirectory(target, id))
