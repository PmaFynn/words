import type { Language } from '../types'

export interface LexiconEntry {
  lemma: string
  language: Language
  partOfSpeech: string
  definitions: string[]
  etymology?: string
  examples: string[]
  source: string
}

export const lexiconEntries: LexiconEntry[] = [
  { lemma: 'equivocal', language: 'english', partOfSpeech: 'adjective', definitions: ['Open to more than one interpretation or uncertain.'], etymology: 'From Latin aequivocus, “of equal voice.”', examples: ['The witness gave an equivocal answer.'], source: 'Hand-authored offline lexicon' },
  { lemma: 'ambivalent', language: 'english', partOfSpeech: 'adjective', definitions: ['Having mixed or contradictory feelings.'], etymology: 'From Latin ambi- and valere, “to have strength.”', examples: ['She felt ambivalent about the proposal.'], source: 'Hand-authored offline lexicon' },
  { lemma: 'eloquent', language: 'english', partOfSpeech: 'adjective', definitions: ['Fluent or persuasive in speaking or writing.'], etymology: 'From Latin eloqui, “to speak out.”', examples: ['His eloquent explanation changed their minds.'], source: 'Hand-authored offline lexicon' },
  { lemma: 'pragmatic', language: 'english', partOfSpeech: 'adjective', definitions: ['Focused on practical results.'], etymology: 'From Greek pragma, “deed.”', examples: ['They chose a pragmatic solution.'], source: 'Hand-authored offline lexicon' },
  { lemma: 'conundrum', language: 'english', partOfSpeech: 'noun', definitions: ['A confusing and difficult problem.'], etymology: 'A sixteenth-century invented word of uncertain origin.', examples: ['The team faced a conundrum.'], source: 'Hand-authored offline lexicon' },
  { lemma: 'scrutinize', language: 'english', partOfSpeech: 'verb', definitions: ['To examine closely and critically.'], etymology: 'From Latin scrutari, “to search through.”', examples: ['The editor will scrutinize every claim.'], source: 'Hand-authored offline lexicon' },
  { lemma: 'mitigate', language: 'english', partOfSpeech: 'verb', definitions: ['To make something less severe or harmful.'], etymology: 'From Latin mitigare, “to make mild.”', examples: ['The change should mitigate the risk.'], source: 'Hand-authored offline lexicon' },
  { lemma: 'intendieren', language: 'german', partOfSpeech: 'Verb', definitions: ['Etwas beabsichtigen oder als Ziel verfolgen.'], etymology: 'Vom lateinischen intendere, „richten auf“.', examples: ['Die Formulierung intendiert eine Kritik.'], source: 'Hand-authored offline lexicon' },
  { lemma: 'ambivalent', language: 'german', partOfSpeech: 'Adjektiv', definitions: ['Zwiespältig oder von widersprüchlichen Gefühlen geprägt.'], etymology: 'Aus lateinisch ambivalere.', examples: ['Seine ambivalente Reaktion blieb unklar.'], source: 'Hand-authored offline lexicon' },
  { lemma: 'prägnant', language: 'german', partOfSpeech: 'Adjektiv', definitions: ['Kurz, klar und einprägsam formuliert.'], etymology: 'Aus lateinisch praegnans, „voll.”', examples: ['Der Autor formuliert das Ergebnis prägnant.'], source: 'Hand-authored offline lexicon' },
  { lemma: 'kohärent', language: 'german', partOfSpeech: 'Adjektiv', definitions: ['In sich schlüssig und zusammenhängend.'], etymology: 'Aus lateinisch cohaerere, „zusammenhängen.”', examples: ['Die Argumentation wirkt kohärent.'], source: 'Hand-authored offline lexicon' },
  { lemma: 'apodiktisch', language: 'german', partOfSpeech: 'Adjektiv', definitions: ['Mit dem Anspruch unbedingter Gewissheit auftretend.'], etymology: 'Aus griechisch apodeiktikos, „beweisend.”', examples: ['Seine apodiktische Behauptung ließ keinen Widerspruch zu.'], source: 'Hand-authored offline lexicon' },
]