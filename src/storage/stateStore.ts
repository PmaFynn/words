import { seedEntries } from '../data/words'
import { createNewProgress } from '../domain/scheduler'
import type { Language, LearningState, WordEntry, WordProgress } from '../types'

export const STORAGE_KEY = 'lexicon-learning-state-v1'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function emptyDailyIntroductions() {
  return { english: null, german: null }
}

export function createInitialState(entries: WordEntry[] = seedEntries, now = Date.now()): LearningState {
  const progress = Object.fromEntries(entries.map((entry) => [entry.id, createNewProgress(entry.id, now)]))
  return { schemaVersion: 1, entries, progress, dailyIntroductions: emptyDailyIntroductions() }
}

function isLanguage(value: unknown): value is Language {
  return value === 'english' || value === 'german'
}

function isEntry(value: unknown): value is WordEntry {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<WordEntry>
  return Boolean(
    typeof candidate.id === 'string' &&
      isLanguage(candidate.language) &&
      typeof candidate.term === 'string' &&
      Array.isArray(candidate.definitions) &&
      typeof candidate.partOfSpeech === 'string' &&
      Array.isArray(candidate.tags) &&
      typeof candidate.example === 'string' &&
      typeof candidate.cloze === 'string' &&
      Array.isArray(candidate.acceptedAnswers),
  )
}

function isProgress(value: unknown): value is WordProgress {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<WordProgress>
  return Boolean(
    typeof candidate.wordId === 'string' &&
      ['new', 'learning', 'review', 'excluded'].includes(candidate.status ?? '') &&
      typeof candidate.priority === 'number' &&
      typeof candidate.dueAt === 'string' &&
      typeof candidate.intervalDays === 'number' &&
      typeof candidate.easeFactor === 'number' &&
      typeof candidate.repetitions === 'number' &&
      typeof candidate.lapses === 'number' &&
      candidate.practice &&
      typeof candidate.practice.practiceCount === 'number',
  )
}

function normaliseState(value: unknown, defaults: LearningState, now: number): LearningState | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<LearningState>
  if (candidate.schemaVersion !== 1 || !Array.isArray(candidate.entries) || !candidate.progress) return null
  if (!candidate.entries.every(isEntry)) return null

  const entries = [...defaults.entries]
  const knownIds = new Set(entries.map((entry) => entry.id))
  for (const entry of candidate.entries) {
    if (!knownIds.has(entry.id)) entries.push(entry)
  }

  const progress: Record<string, WordProgress> = { ...defaults.progress }
  for (const entry of entries) {
    const savedProgress = candidate.progress[entry.id]
    if (savedProgress && isProgress(savedProgress)) {
      progress[entry.id] = {
        ...savedProgress,
        updatedAt: savedProgress.updatedAt ?? savedProgress.lastReviewedAt ?? savedProgress.dueAt,
      }
    }
    if (!progress[entry.id]) progress[entry.id] = createNewProgress(entry.id, now)
  }

  const dailyIntroductions = candidate.dailyIntroductions
  return {
    schemaVersion: 1,
    entries,
    progress,
    dailyIntroductions: {
      english: dailyIntroductions?.english ?? null,
      german: dailyIntroductions?.german ?? null,
    },
  }
}

function resolveStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage
  if (typeof localStorage === 'undefined') return null
  return localStorage
}

export function loadState(storage?: StorageLike, now = Date.now()): LearningState {
  const defaults = createInitialState(seedEntries, now)
  const resolvedStorage = resolveStorage(storage)
  if (!resolvedStorage) return defaults

  try {
    const saved = resolvedStorage.getItem(STORAGE_KEY)
    if (!saved) return defaults
    return normaliseState(JSON.parse(saved) as unknown, defaults, now) ?? defaults
  } catch {
    return defaults
  }
}

export function saveState(state: LearningState, storage?: StorageLike): boolean {
  const resolvedStorage = resolveStorage(storage)
  if (!resolvedStorage) return false
  try {
    resolvedStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function exportState(state: LearningState): string {
  return JSON.stringify(state, null, 2)
}

export function importState(serialized: string, now = Date.now()): LearningState | null {
  try {
    return normaliseState(JSON.parse(serialized) as unknown, createInitialState(seedEntries, now), now)
  } catch {
    return null
  }
}

export function resetState(storage?: StorageLike, now = Date.now()): LearningState {
  const freshState = createInitialState(seedEntries, now)
  resolveStorage(storage)?.removeItem(STORAGE_KEY)
  return freshState
}

export function updateWordProgress(
  state: LearningState,
  wordId: string,
  update: (progress: WordProgress) => WordProgress,
): LearningState {
  const progress = state.progress[wordId]
  if (!progress) return state
  return {
    ...state,
    progress: {
      ...state.progress,
      [wordId]: { ...update(progress), updatedAt: new Date().toISOString() },
    },
  }
}

export function addCustomEntry(state: LearningState, entry: WordEntry, now = Date.now()): LearningState {
  if (state.entries.some((existing) => existing.id === entry.id)) return state
  return {
    ...state,
    entries: [...state.entries, { ...entry, custom: true, updatedAt: new Date(now).toISOString() }],
    progress: {
      ...state.progress,
      [entry.id]: { ...createNewProgress(entry.id, now), priority: 100 },
    },
  }
}

function progressTimestamp(progress: WordProgress): number {
  const timestamp = progress.updatedAt ?? progress.lastReviewedAt ?? progress.dueAt
  const parsed = Date.parse(timestamp)
  return Number.isNaN(parsed) ? 0 : parsed
}

function entryTimestamp(entry: WordEntry): number {
  const parsed = entry.updatedAt ? Date.parse(entry.updatedAt) : 0
  return Number.isNaN(parsed) ? 0 : parsed
}

export function updateWordEntry(
  state: LearningState,
  wordId: string,
  update: (entry: WordEntry) => WordEntry,
  now = Date.now(),
): LearningState {
  if (!state.entries.some((entry) => entry.id === wordId)) return state
  return {
    ...state,
    entries: state.entries.map((entry) => entry.id === wordId
      ? { ...update(entry), updatedAt: new Date(now).toISOString() }
      : entry),
  }
}

export function mergeStates(local: LearningState, remote: LearningState): LearningState {
  const entries = [...local.entries]
  for (const entry of remote.entries) {
    const localIndex = entries.findIndex((localEntry) => localEntry.id === entry.id)
    if (localIndex === -1) {
      entries.push(entry)
    } else if (entryTimestamp(entry) > entryTimestamp(entries[localIndex])) {
      entries[localIndex] = entry
    }
  }

  const progress: Record<string, WordProgress> = { ...local.progress }
  for (const entry of entries) {
    const localProgress = local.progress[entry.id]
    const remoteProgress = remote.progress[entry.id]
    if (!localProgress && remoteProgress) {
      progress[entry.id] = remoteProgress
      continue
    }
    if (!localProgress || !remoteProgress) continue

    if (localProgress.status === 'new' && remoteProgress.status !== 'new') {
      progress[entry.id] = remoteProgress
    } else if (remoteProgress.status !== 'new' && localProgress.status !== 'new') {
      progress[entry.id] = progressTimestamp(remoteProgress) >= progressTimestamp(localProgress) ? remoteProgress : localProgress
    } else if (progressTimestamp(remoteProgress) > progressTimestamp(localProgress)) {
      progress[entry.id] = remoteProgress
    }
  }

  return {
    schemaVersion: 1,
    entries,
    progress,
    dailyIntroductions: {
      english: [local.dailyIntroductions.english, remote.dailyIntroductions.english].filter(Boolean).sort().at(-1) ?? null,
      german: [local.dailyIntroductions.german, remote.dailyIntroductions.german].filter(Boolean).sort().at(-1) ?? null,
    },
  }
}