import { describe, expect, it } from 'vitest'
import { beginNewWord, countNew, getDueReviews, getNewCandidates, selectNextWord } from './queue'
import { createInitialState, updateWordProgress } from '../storage/stateStore'

const NOW = Date.parse('2026-02-01T12:00:00.000Z')

describe('language queues', () => {
  it('keeps English and German new-word slots independent', () => {
    let state = createInitialState(undefined, NOW)
    const english = selectNextWord(state, 'english', NOW)
    expect(english?.isNew).toBe(true)
    state = beginNewWord(state, 'english', english?.entry.id ?? '', NOW)

    expect(selectNextWord(state, 'english', NOW)).toBeNull()
    expect(selectNextWord(state, 'german', NOW)?.isNew).toBe(true)
  })

  it('orders promoted new entries before ordinary candidates', () => {
    let state = createInitialState(undefined, NOW)
    const firstGerman = getNewCandidates(state, 'german')[0]
    state = updateWordProgress(state, firstGerman.id, (progress) => ({ ...progress, priority: 100 }))

    expect(selectNextWord(state, 'german', NOW)?.entry.id).toBe(firstGerman.id)
  })

  it('excludes excluded entries from new and due queues', () => {
    let state = createInitialState(undefined, NOW)
    const firstEnglish = getNewCandidates(state, 'english')[0]
    state = updateWordProgress(state, firstEnglish.id, (progress) => ({ ...progress, status: 'excluded' }))

    expect(getNewCandidates(state, 'english').map((entry) => entry.id)).not.toContain(firstEnglish.id)
    expect(getDueReviews(state, 'english', NOW + 100_000)).not.toContain(firstEnglish)
    expect(countNew(state, 'english')).toBe(49)
  })
})