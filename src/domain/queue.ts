import type { Language, LearningState, WordEntry, WordProgress } from '../types'

export interface ReviewSelection {
  entry: WordEntry
  isNew: boolean
}

function dayKey(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function sortEntries(entries: WordEntry[], progress: Record<string, WordProgress>): WordEntry[] {
  return [...entries].sort((left, right) => {
    const leftProgress = progress[left.id]
    const rightProgress = progress[right.id]
    const priorityDifference = (rightProgress?.priority ?? 0) - (leftProgress?.priority ?? 0)
    if (priorityDifference !== 0) return priorityDifference
    const dueDifference = (Date.parse(leftProgress?.dueAt ?? '') || 0) - (Date.parse(rightProgress?.dueAt ?? '') || 0)
    if (dueDifference !== 0) return dueDifference
    return left.id.localeCompare(right.id)
  })
}

function entriesForLanguage(state: LearningState, language: Language): WordEntry[] {
  return state.entries.filter((entry) => entry.language === language)
}

export function getDueReviews(state: LearningState, language: Language, now: number): WordEntry[] {
  return sortEntries(
    entriesForLanguage(state, language).filter((entry) => {
      const progress = state.progress[entry.id]
      return progress && progress.status !== 'new' && progress.status !== 'excluded' && Date.parse(progress.dueAt) <= now
    }),
    state.progress,
  )
}

export function getNewCandidates(state: LearningState, language: Language): WordEntry[] {
  return sortEntries(
    entriesForLanguage(state, language).filter((entry) => state.progress[entry.id]?.status === 'new'),
    state.progress,
  )
}

export function selectNextWord(state: LearningState, language: Language, now: number): ReviewSelection | null {
  const dueReview = getDueReviews(state, language, now)[0]
  if (dueReview) return { entry: dueReview, isNew: false }

  const lastIntroduction = state.dailyIntroductions[language]
  if (lastIntroduction === dayKey(now)) return null

  const newEntry = getNewCandidates(state, language)[0]
  return newEntry ? { entry: newEntry, isNew: true } : null
}

export function beginNewWord(state: LearningState, language: Language, entryId: string, now: number): LearningState {
  const progress = state.progress[entryId]
  if (!progress || progress.status !== 'new') return state

  return {
    ...state,
    dailyIntroductions: { ...state.dailyIntroductions, [language]: dayKey(now) },
    progress: {
      ...state.progress,
      [entryId]: {
        ...progress,
        status: 'learning',
        dueAt: new Date(now + 10 * 60_000).toISOString(),
        updatedAt: new Date(now).toISOString(),
      },
    },
  }
}

export function countDue(state: LearningState, language: Language, now: number): number {
  return getDueReviews(state, language, now).length
}

export function countNew(state: LearningState, language: Language): number {
  return getNewCandidates(state, language).length
}