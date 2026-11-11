import { describe, expect, it } from 'vitest'
import { createGapFromExample, lookupLexicon, makeCustomEntryData } from './lexicon'

describe('offline lexicon', () => {
  it('looks up terms without a network request', () => {
    expect(lookupLexicon('EQUIVOCAL', 'english')?.partOfSpeech).toBe('adjective')
    expect(lookupLexicon('missing-word', 'english')).toBeNull()
  })

  it('creates a single gap from a matching example', () => {
    expect(createGapFromExample('The witness gave an equivocal answer.', 'equivocal')).toBe('The witness gave an _____ answer.')
    expect(createGapFromExample('No matching term here.', 'equivocal')).toBeNull()
  })

  it('leaves unknown terms ready for manual entry', () => {
    const data = makeCustomEntryData('newterm', 'english', null)

    expect(data.definitions).toEqual([])
    expect(data.example).toBe('')
    expect(data.cloze).toBe('')
  })
})