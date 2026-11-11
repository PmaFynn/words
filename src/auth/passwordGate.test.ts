import { describe, expect, it } from 'vitest'
import { isUnlocked, lock, unlock, verifyPassword } from './passwordGate'

class SessionStorageMock {
  private values = new Map<string, string>()
  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void { this.values.set(key, value) }
  removeItem(key: string): void { this.values.delete(key) }
}

describe('password gate', () => {
  it('accepts the configured password and rejects another one', async () => {
    expect(await verifyPassword('wordgarden')).toBe(true)
    expect(await verifyPassword('not-the-password')).toBe(false)
  })

  it('stores only a session unlock marker', () => {
    const session = new SessionStorageMock() as unknown as Storage
    expect(isUnlocked(session)).toBe(false)
    unlock(session)
    expect(isUnlocked(session)).toBe(true)
    lock(session)
    expect(isUnlocked(session)).toBe(false)
  })
})