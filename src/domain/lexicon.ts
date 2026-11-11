import { lexiconEntries, type LexiconEntry } from '../data/lexicon.generated'
import type { Language } from '../types'

function normalise(value: string): string {
  return value.trim().toLocaleLowerCase()
}

export function lookupLexicon(term: string, language: Language): LexiconEntry | null {
  const wanted = normalise(term)
  return lexiconEntries.find((entry) => entry.language === language && normalise(entry.lemma) === wanted) ?? null
}

export function createGapFromExample(example: string, term: string): string | null {
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`\\b${escapedTerm}\\b`, 'iu').exec(example)
  if (!match || match.index === undefined) return null
  return `${example.slice(0, match.index)}_____${example.slice(match.index + match[0].length)}`
}

export function makeCustomEntryData(term: string, language: Language, lookup: LexiconEntry | null) {
  const sourceExample = lookup?.examples[0]
  const cloze = sourceExample ? createGapFromExample(sourceExample, term) : null
  return {
    term: term.trim(),
    language,
    definitions: lookup?.definitions ?? [],
    etymology: lookup?.etymology,
    partOfSpeech: lookup?.partOfSpeech ?? 'word',
    example: sourceExample ?? '',
    cloze: cloze ?? '',
    source: lookup ? { label: lookup.source, modified: true } : undefined,
  }
}