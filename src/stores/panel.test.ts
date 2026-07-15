import test from 'node:test'
import assert from 'node:assert/strict'
import { createPinia, setActivePinia } from 'pinia'
import { usePanelStore } from './panel.ts'

function installLocalStorage() {
  const store = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, String(value)) },
      removeItem: (key: string) => { store.delete(key) },
      clear: () => { store.clear() },
    },
  })
}

test('resetTraffic clears only total traffic data', () => {
  installLocalStorage()
  setActivePinia(createPinia())

  const panel = usePanelStore()
  panel.bytesUsed = 4096
  panel.speed = 512
  panel.speedBit = 4096
  panel.runTimeStamp = 12
  panel.runTimeShow = '12s'
  panel.show = {
    allUsed: '4 KB',
    speed: '512 B/s',
    speedBit: '4 Kbps',
  }
  panel.predict = {
    min: '30 KB',
    hour: '1 MB',
    day: '24 MB',
    mon: '720 MB',
  }
  panel.lastError = 'keep error'
  panel.lastWarning = 'keep warning'

  panel.resetTraffic()

  assert.equal(panel.bytesUsed, 0)
  assert.equal(panel.show.allUsed, '-')
  assert.equal(panel.speed, 512)
  assert.equal(panel.speedBit, 4096)
  assert.equal(panel.runTimeStamp, 12)
  assert.equal(panel.runTimeShow, '12s')
  assert.equal(panel.show.speed, '512 B/s')
  assert.equal(panel.show.speedBit, '4 Kbps')
  assert.deepEqual(panel.predict, {
    min: '30 KB',
    hour: '1 MB',
    day: '24 MB',
    mon: '720 MB',
  })
  assert.equal(panel.lastError, 'keep error')
  assert.equal(panel.lastWarning, 'keep warning')
})
