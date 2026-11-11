import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

interface SourceEntry {
  lemma: string
  language: 'english' | 'german'
  partOfSpeech: string
  definitions: string[]
  etymology?: string
  examples?: string[]
  source: string
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = resolve(projectRoot, 'data/dictionary-source.json')
const outputPath = resolve(projectRoot, 'src/data/lexicon.generated.ts')

try {
  const source = JSON.parse(await readFile(sourcePath, 'utf8')) as unknown
  if (!Array.isArray(source)) throw new Error('The dictionary source must be a JSON array.')
  const entries = source.filter((entry): entry is SourceEntry => Boolean(entry && typeof entry === 'object' && 'lemma' in entry && 'language' in entry && 'definitions' in entry && 'source' in entry))
  const output = `import type { Language } from '../types'\n\nexport interface LexiconEntry {\n  lemma: string\n  language: Language\n  partOfSpeech: string\n  definitions: string[]\n  etymology?: string\n  examples: string[]\n  source: string\n}\n\nexport const lexiconEntries: LexiconEntry[] = ${JSON.stringify(entries.map((entry) => ({ ...entry, examples: entry.examples ?? [] })), null, 2)}\n`
  await writeFile(outputPath, output, 'utf8')
  console.log(`Generated ${entries.length} lexicon entries.`)
} catch (error) {
  console.error(`Could not build the lexicon. Add an open-licensed JSON snapshot at ${sourcePath}.`)
  throw error
}