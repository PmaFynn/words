import { describe, expect, it } from 'vitest'
import { seedEntries } from '../data/words'
import { createInitialState, exportState, importState, loadState, mergeStates, saveState, STORAGE_KEY, updateWordEntry, updateWordProgress, type StorageLike } from './stateStore'

class MemoryStorage implements StorageLike {
  private values = new Map<string, string>()

  getItem(key: string): string | null { return this.values.get(key) ?? null }
  setItem(key: string, value: string): void { this.values.set(key, value) }
  removeItem(key: string): void { this.values.delete(key) }
}

const NOW = Date.parse('2026-03-01T12:00:00.000Z')

describe('state store', () => {
  it('seeds both languages and persists progress', () => {
    const storage = new MemoryStorage()
    const state = createInitialState(seedEntries, NOW)
    expect(state.entries.filter((entry) => entry.language === 'english')).toHaveLength(50)
    expect(state.entries.filter((entry) => entry.language === 'german')).toHaveLength(50)

    saveState(state, storage)
    expect(storage.getItem(STORAGE_KEY)).toBeTruthy()
    expect(loadState(storage, NOW).entries).toHaveLength(100)
  })

  it('recovers from malformed storage', () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEY, '{not json')

    expect(loadState(storage, NOW).entries).toHaveLength(100)
  })

  it('rejects invalid imports and accepts valid exports', () => {
    const state = createInitialState(seedEntries, NOW)
    expect(importState('{"schemaVersion":99}', NOW)).toBeNull()
    expect(importState(exportState(state), NOW)?.entries).toHaveLength(100)
  })

  it('keeps reviewed cloud progress when merging onto a fresh device', () => {
    const local = createInitialState(seedEntries, NOW)
    const remote = updateWordProgress(local, seedEntries[0].id, (progress) => ({
      ...progress,
      status: 'review',
      repetitions: 1,
      lastReviewedAt: new Date(NOW + 86_400_000).toISOString(),
    }))

    const merged = mergeStates(local, remote)

    expect(merged.progress[seedEntries[0].id].status).toBe('review')
    expect(merged.progress[seedEntries[0].id].repetitions).toBe(1)
  })

  it('updates word metadata without changing its stable ID', () => {
    const state = createInitialState(seedEntries, NOW)
    const originalId = seedEntries[0].id
    const updated = updateWordEntry(state, originalId, (entry) => ({
      ...entry,
      definitions: ['Edited definition'],
    }), NOW + 1_000)

    expect(updated.entries.find((entry) => entry.id === originalId)?.definitions).toEqual(['Edited definition'])
    expect(updated.progress[originalId]).toEqual(state.progress[originalId])
  })

  it('prefers newer edited metadata during a merge', () => {
    const local = createInitialState(seedEntries, NOW)
    const remote = updateWordEntry(local, seedEntries[0].id, (entry) => ({
      ...entry,
      term: 'edited-term',
    }), NOW + 1_000)

    expect(mergeStates(local, remote).entries.find((entry) => entry.id === seedEntries[0].id)?.term).toBe('edited-term')
  })
})