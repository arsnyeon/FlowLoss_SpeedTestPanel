import assert from 'node:assert/strict'
import test from 'node:test'
import { safeWebNodeHeaders } from './webNodeHeaders.ts'

test('keeps custom headers on HTTPS download nodes', () => {
  const result = safeWebNodeHeaders('{"Authorization":"Bearer secret","X-Test":"ok"}', 'https://example.com/file')
  assert.equal(result.removedSensitive, false)
  assert.deepEqual(result.headers, { Authorization: 'Bearer secret', 'X-Test': 'ok' })
})

test('removes sensitive headers from cleartext download nodes', () => {
  const result = safeWebNodeHeaders('{"Authorization":"Bearer secret","X-Test":"ok"}', 'http://example.com/file')
  assert.equal(result.removedSensitive, true)
  assert.deepEqual(result.headers, { 'X-Test': 'ok' })
})
