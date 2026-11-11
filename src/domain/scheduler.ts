import type { ReviewRating, WordProgress, WordStatus } from '../types'

const MIN_EASE_FACTOR = 1.3
const MAX_EASE_FACTOR = 3.0
const AGAIN_DELAY_MINUTES = 10

function clampEaseFactor(value: number): number {
  return Math.min(MAX_EASE_FACTOR, Math.max(MIN_EASE_FACTOR, Number(value.toFixed(2))))
}

function addMinutes(timestamp: number, minutes: number): string {
  return new Date(timestamp + minutes * 60_000).toISOString()
}

function addDays(timestamp: number, days: number): string {
  return new Date(timestamp + days * 86_400_000).toISOString()
}

export interface ScheduledProgress extends WordProgress {
  status: WordStatus
}

export function scheduleReview(progress: WordProgress, rating: ReviewRating, reviewedAt: number): ScheduledProgress {
  const isAgain = rating === 'again'
  const nextEase = clampEaseFactor(
    progress.easeFactor + (rating === 'easy' ? 0.15 : rating === 'hard' ? -0.15 : isAgain ? -0.2 : 0),
  )
  const nextRepetitions = isAgain ? progress.repetitions : progress.repetitions + 1
  const nextInterval = isAgain
    ? Math.max(0.01, Math.min(1, progress.intervalDays || 0.01))
    : rating === 'hard'
      ? Math.max(1, Math.round((progress.intervalDays || 1) * 1.2))
      : rating === 'easy'
        ? Math.max(4, Math.round((progress.intervalDays || 1) * nextEase * 1.3))
        : progress.repetitions === 0
          ? 1
          : Math.max(2, Math.round((progress.intervalDays || 1) * nextEase))

  return {
    ...progress,
    status: isAgain ? 'learning' : 'review',
    dueAt: isAgain ? addMinutes(reviewedAt, AGAIN_DELAY_MINUTES) : addDays(reviewedAt, nextInterval),
    intervalDays: nextInterval,
    easeFactor: nextEase,
    repetitions: nextRepetitions,
    lapses: progress.lapses + (isAgain ? 1 : 0),
    lastReviewedAt: new Date(reviewedAt).toISOString(),
    updatedAt: new Date(reviewedAt).toISOString(),
  }
}

export function createNewProgress(wordId: string, now: number): WordProgress {
  return {
    wordId,
    status: 'new',
    priority: 0,
    dueAt: new Date(now).toISOString(),
    intervalDays: 0,
    easeFactor: 2.5,
    repetitions: 0,
    lapses: 0,
    updatedAt: new Date(now).toISOString(),
    practice: { practiceCount: 0 },
  }
}