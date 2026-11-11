import { describe, expect, it } from 'vitest'
import { createNewProgress, scheduleReview } from './scheduler'

const REVIEWED_AT = Date.parse('2026-01-01T00:00:00.000Z')

describe('scheduleReview', () => {
  it('moves a new word to a one-day review after Good', () => {
    const progress = createNewProgress('test', REVIEWED_AT)
    const scheduled = scheduleReview({ ...progress, status: 'learning' }, 'good', REVIEWED_AT)

    expect(scheduled.status).toBe('review')
    expect(scheduled.intervalDays).toBe(1)
    expect(scheduled.repetitions).toBe(1)
    expect(scheduled.dueAt).toBe('2026-01-02T00:00:00.000Z')
  })

  it('keeps Again close and records a lapse', () => {
    const progress = createNewProgress('test', REVIEWED_AT)
    const scheduled = scheduleReview({ ...progress, status: 'learning' }, 'again', REVIEWED_AT)

    expect(scheduled.status).toBe('learning')
    expect(scheduled.lapses).toBe(1)
    expect(scheduled.dueAt).toBe('2026-01-01T00:10:00.000Z')
  })

  it('never reduces ease below the floor', () => {
    const progress = { ...createNewProgress('test', REVIEWED_AT), easeFactor: 1.31, status: 'review' as const }
    const scheduled = scheduleReview(progress, 'again', REVIEWED_AT)

    expect(scheduled.easeFactor).toBe(1.3)
  })
})