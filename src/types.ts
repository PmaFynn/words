export type Language = 'english' | 'german'

export const languages: readonly Language[] = ['english', 'german']

export type WordStatus = 'new' | 'learning' | 'review' | 'excluded'

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

export interface WordSource {
  label: string
  url?: string
  license?: string
  snapshotDate?: string
  modified?: boolean
}

export interface WordEntry {
  id: string
  language: Language
  term: string
  counterpart?: string
  definitions: string[]
  etymology?: string
  partOfSpeech: string
  tags: string[]
  example: string
  cloze: string
  acceptedAnswers: string[]
  source?: WordSource
  custom?: boolean
  updatedAt?: string
}

export interface SentencePractice {
  latestSentence?: string
  practiceCount: number
  lastPracticedAt?: string
}

export interface WordProgress {
  wordId: string
  status: WordStatus
  priority: number
  dueAt: string
  intervalDays: number
  easeFactor: number
  repetitions: number
  lapses: number
  lastReviewedAt?: string
  updatedAt?: string
  practice: SentencePractice
}

export interface DailyIntroductions {
  english: string | null
  german: string | null
}

export interface LearningState {
  schemaVersion: 1
  entries: WordEntry[]
  progress: Record<string, WordProgress>
  dailyIntroductions: DailyIntroductions
}