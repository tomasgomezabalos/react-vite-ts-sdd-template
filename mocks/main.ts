import { worker } from './browser'

await worker.start({ onUnhandledRequest: 'bypass' })
await import('../src/main')
