import './styles.css'

import { isUnlocked, lock, unlock, verifyPassword } from './auth/passwordGate'
import { beginNewWord, countDue, countNew, selectNextWord } from './domain/queue'
import { createGapFromExample, lookupLexicon, makeCustomEntryData } from './domain/lexicon'
import { scheduleReview } from './domain/scheduler'
import {
  addCustomEntry,
  exportState,
  importState,
  loadState,
  mergeStates,
  resetState,
  saveState,
  updateWordEntry,
  updateWordProgress,
} from './storage/stateStore'
import {
  createSyncAccount,
  downloadSyncedState,
  getSyncAccount,
  isSyncConfigured,
  signInToSync,
  signOutOfSync,
  type SyncAccount,
  uploadSyncedState,
} from './sync/supabaseSync'
import type { Language, LearningState, ReviewRating, WordEntry, WordStatus } from './types'

const root = document.querySelector<HTMLDivElement>('#app')
if (!root) throw new Error('The application root is missing.')
const app: HTMLDivElement = root

type View = 'practice' | 'words' | 'settings'

interface ReviewState {
  entryId: string
  isNew: boolean
  phase: 'learn' | 'recall'
  revealed: boolean
  practiceDone: boolean
}

let state = loadState()
let language: Language = 'english'
let view: View = 'practice'
let review: ReviewState | null = null
let notice = ''
let wordFilter = ''
let wordStatusFilter: 'active' | 'excluded' = 'active'
let editingEntryId: string | null = null
let syncAccount: SyncAccount | null = null
let syncBusy = false

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function languageLabel(value: Language): string {
  return value === 'english' ? 'English' : 'Deutsch'
}

function statusLabel(status: WordStatus): string {
  return { new: 'new', learning: 'learning', review: 'review', excluded: 'excluded' }[status]
}

function getEntry(entryId: string): WordEntry | undefined {
  return state.entries.find((entry) => entry.id === entryId)
}

function persist(nextState: LearningState): void {
  state = nextState
  if (!saveState(state)) notice = 'Progress could not be saved in this browser.'
  if (syncAccount) {
    void uploadSyncedState(state).catch(() => {
      notice = 'Saved here, but cloud sync needs attention.'
      render()
    })
  }
}

function renderGate(error = ''): void {
  app.innerHTML = `
    <main class="gate-shell">
      <section class="gate-panel" aria-labelledby="gate-title">
        <p class="eyebrow">PRIVATE STUDY SPACE</p>
        <h1 id="gate-title">Lexicon</h1>
        <p class="gate-copy">A quiet place for one useful word at a time.</p>
        <form data-form="gate" class="stack-form">
          <label for="password">Password</label>
          <input id="password" name="password" type="password" autocomplete="current-password" required autofocus />
          <button class="button button-primary" type="submit">Enter workspace</button>
          <p class="form-error" id="gate-error" role="alert">${escapeHtml(error)}</p>
        </form>
        <p class="fine-print">This is a convenience gate for a static personal site, not security.</p>
      </section>
    </main>
  `
}

function renderLanguageTabs(): string {
  return `
    <div class="language-tabs" role="tablist" aria-label="Learning language">
      ${(['english', 'german'] as const).map((value) => {
        const selected = value === language
        return `<button class="language-tab ${selected ? 'is-selected' : ''}" data-language="${value}" role="tab" aria-selected="${selected}">
          <span>${languageLabel(value)}</span>
          <small>${countDue(state, value, Date.now())} due · ${countNew(state, value)} new</small>
        </button>`
      }).join('')}
    </div>
  `
}

function renderHeader(): string {
  return `
    <header class="topbar">
      <a class="wordmark" href="#" data-view="practice" aria-label="Lexicon practice home">
        <span class="wordmark-glyph">L</span>
        <span>lexicon</span>
      </a>
      <nav class="main-nav" aria-label="Main navigation">
        ${(['practice', 'words', 'settings'] as const).map((item) => `<button class="nav-link ${view === item ? 'is-active' : ''}" data-view="${item}">${item}</button>`).join('')}
      </nav>
      <button class="button button-quiet lock-button" data-action="lock" type="button">Lock</button>
    </header>
  `
}

function renderStats(): string {
  const activeEntries = state.entries.filter((entry) => entry.language === language && state.progress[entry.id]?.status !== 'excluded')
  const learned = activeEntries.filter((entry) => (state.progress[entry.id]?.repetitions ?? 0) > 0).length
  const progressPercent = activeEntries.length ? Math.round((learned / activeEntries.length) * 100) : 0
  return `
    <section class="stats-strip" aria-label="${languageLabel(language)} progress">
      <div><strong>${countDue(state, language, Date.now())}</strong><span>due now</span></div>
      <div><strong>${countNew(state, language)}</strong><span>new words</span></div>
      <div><strong>${progressPercent}%</strong><span>in progress</span></div>
    </section>
  `
}

function renderReview(): string {
  const currentEntry = review ? getEntry(review.entryId) : undefined
  if (!currentEntry || !review) {
    const next = selectNextWord(state, language, Date.now())
    const noMore = !next
    return `
      <section class="review-intro panel">
        <div class="section-kicker">${languageLabel(language)} practice</div>
        <h1>${noMore ? 'Your queue is clear.' : 'Ready for the next word?'}</h1>
        <p>${noMore ? 'There are no due reviews, and today’s new-word slot is already used or empty.' : 'Study the word information first. After that, test yourself with the sentence gap.'}</p>
        <button class="button button-primary button-large" data-action="start-review" type="button" ${noMore ? 'disabled' : ''}>${noMore ? 'Nothing due' : 'Start next review'}</button>
        ${notice ? `<p class="notice" role="status">${escapeHtml(notice)}</p>` : ''}
      </section>
      <section class="practice-note panel-lite">
        <span class="note-mark">01</span>
        <div><strong>One small ritual</strong><p>Read the sentence aloud, make your own sentence, then rate how much you remembered.</p></div>
      </section>
    `
  }

  const activeReview = review
  if (activeReview.phase === 'learn') {
    const example = currentEntry.example.replace('{{gap}}', currentEntry.term)
    return `
      <section class="review-card learn-card panel" aria-labelledby="review-title">
        <div class="review-meta">
          <span class="pill">new today</span>
          <span>${currentEntry.partOfSpeech}</span>
        </div>
        <p class="section-kicker">Learn the word</p>
        <h1 id="review-title" class="learn-term">${escapeHtml(currentEntry.term)}</h1>
        ${currentEntry.counterpart ? `<p class="counterpart">Useful counterpart: <strong>${escapeHtml(currentEntry.counterpart)}</strong></p>` : ''}
        <div class="learn-information">
          <ul class="definition-list">${currentEntry.definitions.map((definition) => `<li>${escapeHtml(definition)}</li>`).join('')}</ul>
          ${currentEntry.etymology ? `<p class="etymology"><strong>Origin:</strong> ${escapeHtml(currentEntry.etymology)}</p>` : ''}
          <p class="learning-example"><strong>Example:</strong> ${escapeHtml(example)}</p>
        </div>
        <div class="reveal-row"><span class="muted">Take a moment to read the meaning and example.</span><button class="button button-primary" data-action="begin-recall" type="button">I learned this word</button></div>
      </section>
    `
  }

  const progress = state.progress[currentEntry.id]
  const practice = progress?.practice
  return `
    <section class="review-card panel" aria-labelledby="review-title">
      <div class="review-meta">
        <span class="pill">${activeReview.isNew ? 'new today' : 'scheduled review'}</span>
        <span>${currentEntry.partOfSpeech}</span>
      </div>
      <p class="section-kicker">Fill the gap</p>
      <h1 id="review-title" class="cloze-text">${escapeHtml(activeReview.revealed ? currentEntry.example : currentEntry.cloze)}</h1>
      ${activeReview.revealed ? `
        <div class="answer-reveal">
          <div class="answer-heading"><span>Answer</span><strong>${escapeHtml(currentEntry.term)}</strong></div>
          ${currentEntry.counterpart ? `<p class="counterpart">Useful counterpart: <strong>${escapeHtml(currentEntry.counterpart)}</strong></p>` : ''}
          <ul class="definition-list">${currentEntry.definitions.map((definition) => `<li>${escapeHtml(definition)}</li>`).join('')}</ul>
          ${currentEntry.etymology ? `<p class="etymology"><strong>Origin:</strong> ${escapeHtml(currentEntry.etymology)}</p>` : ''}
        </div>
        <div class="practice-box">
          <div><p class="section-kicker">Make it yours</p><p class="muted">Write a sentence, or say one aloud and mark it complete.</p></div>
          <textarea data-practice placeholder="Optional: your own sentence" rows="3" ${activeReview.practiceDone ? 'disabled' : ''}>${escapeHtml(practice?.latestSentence ?? '')}</textarea>
          <button class="button button-secondary" data-action="practice" type="button" ${activeReview.practiceDone ? 'disabled' : ''}>${activeReview.practiceDone ? 'Practice recorded' : 'I wrote or said a sentence'}</button>
        </div>
        <div class="rating-box">
          <p class="section-kicker">How well did you recall it?</p>
          <div class="rating-grid">${(['again', 'hard', 'good', 'easy'] as const).map((rating) => `<button class="rating-button rating-${rating}" data-action="rate" data-rating="${rating}" type="button" ${activeReview.practiceDone ? '' : 'disabled'}>${rating[0].toUpperCase()}${rating.slice(1)}</button>`).join('')}</div>
          ${activeReview.practiceDone ? '' : '<p class="muted">Record your sentence practice before choosing a rating.</p>'}
        </div>
      ` : `
        <div class="reveal-row"><span class="muted">The answer stays hidden until you decide.</span><button class="button button-primary" data-action="reveal" type="button">Reveal answer</button></div>
      `}
    </section>
  `
}

function renderPracticeView(): string {
  return `<div class="page-grid"><div class="primary-column">${renderStats()}${renderReview()}</div><aside class="side-column"><section class="panel side-panel"><p class="section-kicker">Today</p><h2>Two queues, one habit.</h2><p>English and German introductions are tracked independently. Reviews remain available when they are due.</p><button class="text-button" data-view="words" type="button">Manage words <span aria-hidden="true">→</span></button></section></aside></div>`
}

function makeSlug(value: string): string {
  return value.toLocaleLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function renderCustomForm(): string {
  const entry = editingEntryId ? getEntry(editingEntryId) : undefined
  const isEditing = Boolean(entry)
  const field = (value: string | undefined): string => escapeHtml(value ?? '')
  const definitions = entry?.definitions.join('\n')
  return `
    <section class="panel custom-form-panel">
      <div class="section-heading"><div><p class="section-kicker">${isEditing ? 'Edit' : 'Add to'} ${languageLabel(language)}</p><h2>${isEditing ? `Edit ${field(entry?.term)}` : 'Bring in a word'}</h2></div>${isEditing ? '' : '<span class="badge-priority">high priority</span>'}</div>
      <form data-form="custom" ${entry ? `data-entry-id="${field(entry.id)}"` : ''} class="custom-form">
        <div class="form-row form-row-wide"><label for="custom-term">Word</label><div class="input-with-button"><input id="custom-term" name="term" value="${field(entry?.term)}" required placeholder="e.g. equivocal" /><button class="button button-secondary" data-action="lookup" type="button">Look up</button></div></div>
        <p class="lookup-status" data-lookup-status>Optional: look up a bundled entry, or fill the fields manually.</p>
        <div class="form-grid">
          <div><label for="custom-counterpart">Optional counterpart</label><input id="custom-counterpart" name="counterpart" value="${field(entry?.counterpart)}" placeholder="meaning in the other language" /></div>
          <div><label for="custom-pos">Part of speech</label><input id="custom-pos" name="partOfSpeech" value="${field(entry?.partOfSpeech ?? 'word')}" /></div>
        </div>
        <label for="custom-definitions">Meaning <span class="label-note">one per line</span></label><textarea id="custom-definitions" name="definitions" rows="3" placeholder="What does it mean?">${field(definitions)}</textarea>
        <label for="custom-etymology">Etymology <span class="label-note">optional</span></label><textarea id="custom-etymology" name="etymology" rows="2" placeholder="Where does it come from?">${field(entry?.etymology)}</textarea>
        <div class="form-grid">
          <div><label for="custom-example">Example sentence</label><textarea id="custom-example" name="example" rows="3" placeholder="Write a natural example.">${field(entry?.example)}</textarea></div>
          <div><label for="custom-cloze">Gap sentence</label><textarea id="custom-cloze" name="cloze" rows="3" placeholder="Replace the word with _____.">${field(entry?.cloze)}</textarea></div>
        </div>
        <div class="form-actions"><button class="button button-primary" type="submit">${isEditing ? 'Save changes' : 'Add to queue'}</button>${isEditing ? '<button class="button button-secondary" data-action="cancel-edit" type="button">Cancel</button>' : '<span class="muted">It will be your next new word in this language.</span>'}</div>
      </form>
    </section>
  `
}

function renderWordList(): string {
  const visibleEntries = state.entries
    .filter((entry) => entry.language === language)
    .filter((entry) => wordStatusFilter === 'excluded' ? state.progress[entry.id]?.status === 'excluded' : state.progress[entry.id]?.status !== 'excluded')
    .filter((entry) => `${entry.term} ${entry.definitions.join(' ')}`.toLocaleLowerCase().includes(wordFilter.toLocaleLowerCase()))
    .sort((left, right) => left.term.localeCompare(right.term))

  return `
    <section class="panel word-list-panel">
      <div class="section-heading"><div><p class="section-kicker">Your library</p><h2>${visibleEntries.length} ${languageLabel(language)} words</h2></div><div class="filter-tabs"><button class="filter-tab ${wordStatusFilter === 'active' ? 'is-selected' : ''}" data-action="word-filter" data-filter="active" type="button">Active</button><button class="filter-tab ${wordStatusFilter === 'excluded' ? 'is-selected' : ''}" data-action="word-filter" data-filter="excluded" type="button">Excluded</button></div></div>
      <label class="search-field"><span class="sr-only">Search words</span><input data-word-search value="${escapeHtml(wordFilter)}" placeholder="Search terms or meanings" /></label>
      <div class="word-list">${visibleEntries.length ? visibleEntries.map((entry) => {
        const progress = state.progress[entry.id]
        const isExcluded = progress?.status === 'excluded'
        return `<article class="word-row"><div class="word-row-main"><div class="word-row-title"><strong>${escapeHtml(entry.term)}</strong><span class="status-dot status-${progress?.status ?? 'new'}">${statusLabel(progress?.status ?? 'new')}</span></div><p>${escapeHtml(entry.definitions[0] ?? 'No definition yet.')}</p><small>${escapeHtml(entry.partOfSpeech)} · priority ${progress?.priority ?? 0}</small></div><div class="word-row-actions"><button class="text-button" data-action="edit" data-entry-id="${entry.id}" type="button">Edit</button>${isExcluded ? `<button class="text-button" data-action="restore" data-entry-id="${entry.id}" type="button">Restore</button>` : `<button class="text-button" data-action="promote" data-entry-id="${entry.id}" type="button">Prioritize</button><button class="text-button text-button-danger" data-action="exclude" data-entry-id="${entry.id}" type="button">Exclude</button>`}<input aria-label="Priority for ${escapeHtml(entry.term)}" data-priority="${entry.id}" type="number" min="0" max="100" value="${progress?.priority ?? 0}" /></div></article>`
      }).join('') : '<p class="empty-state">No words match this view.</p>'}</div>
    </section>
  `
}

function renderWordsView(): string {
  return `<div class="single-column">${renderCustomForm()}${renderWordList()}</div>`
}

function renderSettingsView(): string {
  return `
    <div class="settings-layout">
      <section class="panel settings-panel"><p class="section-kicker">Backup</p><h1>Keep your progress yours.</h1><p>Progress stays in this browser unless you connect the optional private cloud sync. Export a copy before clearing browser data or moving to another device.</p><div class="settings-actions"><button class="button button-primary" data-action="export" type="button">Export progress</button><label class="button button-secondary file-button">Import progress<input data-import type="file" accept="application/json" /></label></div></section>
      ${renderSyncSettings()}
      <section class="panel settings-panel"><p class="section-kicker">Reset</p><h2>Start over</h2><p>This removes progress, custom words, and exclusions from this browser.</p><button class="button button-danger" data-action="reset" type="button">Reset all progress</button></section>
      <section class="panel settings-panel"><p class="section-kicker">About</p><h2>Static by design</h2><p>The app has no application server. Custom words can be entered manually, and the bundled lookup is optional.</p><button class="text-button" data-action="lock" type="button">Lock workspace <span aria-hidden="true">→</span></button></section>
    </div>
  `
}

function renderSyncSettings(): string {
  if (!isSyncConfigured()) {
    return '<section class="panel settings-panel"><p class="section-kicker">Cloud sync</p><h2>Not connected</h2><p>This deployment has no sync account configured. Add the Supabase environment values described in the README, then rebuild the site.</p></section>'
  }
  if (syncAccount) {
    return `<section class="panel settings-panel"><p class="section-kicker">Cloud sync</p><h2>Connected</h2><p class="sync-account">${escapeHtml(syncAccount.email)}</p><p>Progress is cached here and uploaded after changes. The same account works on your other devices.</p><div class="settings-actions"><button class="button button-secondary" data-action="sync-now" type="button" ${syncBusy ? 'disabled' : ''}>${syncBusy ? 'Syncing...' : 'Sync now'}</button><button class="text-button" data-action="sync-signout" type="button">Sign out</button></div></section>`
  }
  return `
    <section class="panel settings-panel">
      <p class="section-kicker">Cloud sync</p>
      <h2>Use your progress everywhere.</h2>
      <p>Create one private account for this app. Your browser cache remains usable when you are offline.</p>
      <form data-form="sync" class="stack-form">
        <label for="sync-email">Email</label>
        <input id="sync-email" name="email" type="email" autocomplete="email" required />
        <label for="sync-password">Sync password</label>
        <input id="sync-password" name="password" type="password" autocomplete="current-password" minlength="6" required />
        <div class="settings-actions"><button class="button button-primary" data-sync-submit="signin" type="submit" ${syncBusy ? 'disabled' : ''}>${syncBusy ? 'Working...' : 'Sign in'}</button><button class="button button-secondary" data-sync-submit="create" type="submit" ${syncBusy ? 'disabled' : ''}>Create account</button></div>
        <p class="fine-print">This is separate from the local workspace password.</p>
      </form>
    </section>
  `
}

function renderApp(): void {
  app.innerHTML = `
    ${renderHeader()}
    <main class="app-main">
      <section class="intro-row"><div><p class="eyebrow">DAILY VOCABULARY PRACTICE</p><h1>${view === 'practice' ? 'Make the word yours.' : view === 'words' ? 'Shape your queues.' : 'Your small archive.'}</h1></div>${renderLanguageTabs()}</section>
      ${notice ? `<p class="global-notice" role="status">${escapeHtml(notice)}</p>` : ''}
      ${view === 'practice' ? renderPracticeView() : view === 'words' ? renderWordsView() : renderSettingsView()}
    </main>
    <footer class="footer"><span>English + Deutsch</span><span>Local cache + optional cloud sync</span></footer>
  `
}

function render(): void {
  if (!isUnlocked()) renderGate()
  else renderApp()
}

function formField(form: HTMLFormElement, name: string): HTMLInputElement | HTMLTextAreaElement | null {
  const field = form.elements.namedItem(name)
  return field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement ? field : null
}

function fieldValue(form: HTMLFormElement, name: string): string {
  return formField(form, name)?.value.trim() ?? ''
}

function setFieldValue(form: HTMLFormElement, name: string, value: string): void {
  const field = formField(form, name)
  if (field) field.value = value
}

function startReview(): void {
  notice = ''
  const selection = selectNextWord(state, language, Date.now())
  if (!selection) {
    render()
    return
  }
  review = { entryId: selection.entry.id, isNew: selection.isNew, phase: selection.isNew ? 'learn' : 'recall', revealed: false, practiceDone: false }
  render()
}

function beginRecall(): void {
  if (!review || !review.isNew || review.phase !== 'learn') return
  persist(beginNewWord(state, language, review.entryId, Date.now()))
  review.phase = 'recall'
  render()
}

function recordPractice(): void {
  if (!review) return
  const textarea = app.querySelector<HTMLTextAreaElement>('[data-practice]')
  const sentence = textarea?.value.trim() ?? ''
  const practicedAt = new Date().toISOString()
  persist(updateWordProgress(state, review.entryId, (progress) => ({
    ...progress,
    practice: {
      latestSentence: sentence || progress.practice.latestSentence,
      practiceCount: progress.practice.practiceCount + 1,
      lastPracticedAt: practicedAt,
    },
  })))
  review.practiceDone = true
  render()
}

function rateReview(rating: ReviewRating): void {
  if (!review?.practiceDone) return
  persist(updateWordProgress(state, review.entryId, (progress) => scheduleReview(progress, rating, Date.now())))
  review = null
  notice = `${rating[0].toUpperCase()}${rating.slice(1)} recorded. Your next review will appear when it is due.`
  render()
}

function updatePriority(entryId: string, value: string): void {
  const priority = Math.max(0, Math.min(100, Number.parseInt(value, 10) || 0))
  persist(updateWordProgress(state, entryId, (progress) => ({ ...progress, priority })))
  render()
}

function promoteWord(entryId: string): void {
  persist(updateWordProgress(state, entryId, (progress) => ({
    ...progress,
    priority: 100,
    status: progress.status === 'excluded' ? 'new' : progress.status,
    dueAt: new Date().toISOString(),
  })))
  notice = 'Word prioritized for this language queue.'
  render()
}

function excludeWord(entryId: string): void {
  if (review?.entryId === entryId) review = null
  persist(updateWordProgress(state, entryId, (progress) => ({ ...progress, status: 'excluded' })))
  notice = 'Word excluded. You can restore it from the Excluded list.'
  render()
}

function restoreWord(entryId: string): void {
  persist(updateWordProgress(state, entryId, (progress) => ({ ...progress, status: 'new', dueAt: new Date().toISOString() })))
  notice = 'Word restored as a new candidate.'
  render()
}

function fillWordForm(form: HTMLFormElement, lookup: ReturnType<typeof lookupLexicon>): void {
  const term = fieldValue(form, 'term')
  const data = makeCustomEntryData(term, language, lookup)
  setFieldValue(form, 'partOfSpeech', data.partOfSpeech)
  setFieldValue(form, 'definitions', data.definitions.join('\n'))
  setFieldValue(form, 'etymology', data.etymology ?? '')
  setFieldValue(form, 'example', data.example)
  setFieldValue(form, 'cloze', data.cloze)
  const status = form.querySelector<HTMLElement>('[data-lookup-status]')
  if (status) status.textContent = lookup ? `Found ${lookup.lemma}. Check the fields, then add it.` : 'No bundled match. Fill the fields manually.'
}

function saveWordEdit(form: HTMLFormElement, entryId: string): void {
  const current = getEntry(entryId)
  if (!current) return

  const term = fieldValue(form, 'term')
  const duplicate = state.entries.find((entry) => entry.id !== entryId && entry.language === language && entry.term.toLocaleLowerCase() === term.toLocaleLowerCase())
  if (duplicate) {
    notice = 'Another word with that spelling already exists in this language.'
    render()
    return
  }

  const example = fieldValue(form, 'example')
  const cloze = fieldValue(form, 'cloze') || createGapFromExample(example, term) || ''
  if (!term || !cloze || !cloze.includes('_____')) {
    notice = 'Add a word and a gap sentence with _____ before saving.'
    render()
    return
  }

  const definitions = fieldValue(form, 'definitions').split('\n').map((item) => item.trim()).filter(Boolean)
  persist(updateWordEntry(state, entryId, (entry) => ({
    ...entry,
    term,
    counterpart: fieldValue(form, 'counterpart') || undefined,
    definitions,
    etymology: fieldValue(form, 'etymology') || undefined,
    partOfSpeech: fieldValue(form, 'partOfSpeech') || 'word',
    example: example || cloze.replace('_____', term),
    cloze,
    acceptedAnswers: [term],
    source: entry.source ? { ...entry.source, modified: true } : { label: 'Personal edit', modified: true },
  })))
  editingEntryId = null
  notice = `${term} updated.`
  render()
}

function addWord(form: HTMLFormElement): void {
  const term = fieldValue(form, 'term')
  if (!term) return

  if (form.dataset.entryId) {
    saveWordEdit(form, form.dataset.entryId)
    return
  }

  const existing = state.entries.find((entry) => entry.language === language && entry.term.toLocaleLowerCase() === term.toLocaleLowerCase())
  if (existing) {
    promoteWord(existing.id)
    return
  }

  const example = fieldValue(form, 'example')
  const cloze = fieldValue(form, 'cloze') || createGapFromExample(example, term) || ''
  if (!cloze || !cloze.includes('_____')) {
    notice = 'Add a gap sentence with _____ before saving this word.'
    render()
    return
  }

  const definitions = fieldValue(form, 'definitions').split('\n').map((item) => item.trim()).filter(Boolean)
  const entry: WordEntry = {
    id: `custom-${language.slice(0, 2)}-${makeSlug(term)}-${Date.now().toString(36)}`,
    language,
    term,
    counterpart: fieldValue(form, 'counterpart') || undefined,
    definitions: definitions.length ? definitions : ['Custom word; add a meaning when you review it.'],
    etymology: fieldValue(form, 'etymology') || undefined,
    partOfSpeech: fieldValue(form, 'partOfSpeech') || 'word',
    tags: ['custom'],
    example: example || cloze.replace('_____', term),
    cloze,
    acceptedAnswers: [term],
    source: { label: 'Personal custom entry', modified: true },
    custom: true,
  }
  persist(addCustomEntry(state, entry))
  editingEntryId = null
  notice = `${term} added with high priority.`
  view = 'words'
  render()
}

async function submitGate(form: HTMLFormElement): Promise<void> {
  const password = fieldValue(form, 'password')
  const valid = await verifyPassword(password)
  if (!valid) {
    renderGate('That password does not match.')
    return
  }
  unlock()
  render()
}

function downloadProgress(): void {
  const blob = new Blob([exportState(state)], { type: 'application/json' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'lexicon-progress.json'
  link.click()
  URL.revokeObjectURL(link.href)
}

async function importProgress(input: HTMLInputElement): Promise<void> {
  const file = input.files?.[0]
  if (!file) return
  const imported = importState(await file.text())
  if (!imported) {
    notice = 'That file is not a valid Lexicon progress export.'
    render()
    return
  }
  persist(imported)
  notice = 'Progress imported.'
  render()
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'The operation could not be completed.'
}

async function syncCurrentDevice(): Promise<void> {
  if (!syncAccount) return
  syncBusy = true
  render()
  try {
    const remotePayload = await downloadSyncedState()
    const remoteState = remotePayload ? importState(JSON.stringify(remotePayload)) : null
    if (remoteState) state = mergeStates(state, remoteState)
    saveState(state)
    await uploadSyncedState(state)
    notice = 'Cloud sync complete.'
  } catch (error) {
    notice = errorMessage(error)
  } finally {
    syncBusy = false
    render()
  }
}

async function submitSync(form: HTMLFormElement, action: 'signin' | 'create'): Promise<void> {
  if (syncBusy) return
  const email = fieldValue(form, 'email')
  const password = fieldValue(form, 'password')
  syncBusy = true
  render()
  try {
    if (action === 'create') {
      const result = await createSyncAccount(email, password)
      if (result.needsConfirmation) {
        notice = 'Check your email to confirm the sync account, then sign in here.'
      } else if (result.account) {
        syncAccount = result.account
        await syncCurrentDevice()
        return
      } else {
        notice = 'The account was created. Sign in here to start syncing.'
      }
    } else {
      syncAccount = await signInToSync(email, password)
      await syncCurrentDevice()
      return
    }
  } catch (error) {
    syncAccount = null
    notice = errorMessage(error)
  }
  syncBusy = false
  render()
}

async function restoreSyncSession(): Promise<void> {
  if (!isSyncConfigured()) return
  try {
    const account = await getSyncAccount()
    if (!account) return
    syncAccount = account
    await syncCurrentDevice()
  } catch (error) {
    syncAccount = null
    notice = errorMessage(error)
    render()
  }
}

app.addEventListener('submit', (event) => {
  const form = event.target
  if (!(form instanceof HTMLFormElement)) return
  event.preventDefault()
  if (form.dataset.form === 'gate') void submitGate(form)
  if (form.dataset.form === 'custom') addWord(form)
  if (form.dataset.form === 'sync') {
    const submitter = event instanceof SubmitEvent ? submitterFromEvent(event) : null
    void submitSync(form, submitter === 'create' ? 'create' : 'signin')
  }
})

function submitterFromEvent(event: SubmitEvent): string | undefined {
  return event.submitter instanceof HTMLElement ? event.submitter.dataset.syncSubmit : undefined
}

app.addEventListener('input', (event) => {
  const target = event.target
  if (target instanceof HTMLInputElement && target.matches('[data-word-search]')) {
    wordFilter = target.value
    render()
    const search = app.querySelector<HTMLInputElement>('[data-word-search]')
    search?.focus()
    search?.setSelectionRange(wordFilter.length, wordFilter.length)
  }
})

app.addEventListener('change', (event) => {
  const target = event.target
  if (target instanceof HTMLInputElement && target.dataset.priority) updatePriority(target.dataset.priority, target.value)
  if (target instanceof HTMLInputElement && target.matches('[data-import]')) void importProgress(target)
})

app.addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof HTMLElement)) return
  const button = target.closest<HTMLElement>('[data-action], [data-view], [data-language]')
  if (!button) return

  const nextView = button.dataset.view as View | undefined
  if (nextView) {
    if (nextView !== 'words') editingEntryId = null
    view = nextView
    notice = ''
    render()
    return
  }

  const nextLanguage = button.dataset.language as Language | undefined
  if (nextLanguage) {
    editingEntryId = null
    language = nextLanguage
    review = null
    notice = ''
    render()
    return
  }

  const action = button.dataset.action
  if (action === 'lock') {
    lock()
    review = null
    render()
  } else if (action === 'start-review') startReview()
  else if (action === 'begin-recall') beginRecall()
  else if (action === 'reveal' && review) {
    review.revealed = true
    render()
  } else if (action === 'practice') recordPractice()
  else if (action === 'rate') rateReview(button.dataset.rating as ReviewRating)
  else if (action === 'edit' && button.dataset.entryId) {
    editingEntryId = button.dataset.entryId
    view = 'words'
    notice = ''
    render()
  }
  else if (action === 'cancel-edit') {
    editingEntryId = null
    render()
  }
  else if (action === 'lookup') {
    const form = button.closest<HTMLFormElement>('form')
    if (!form) return
    const lookup = lookupLexicon(fieldValue(form, 'term'), language)
    fillWordForm(form, lookup)
  } else if (action === 'word-filter') {
    wordStatusFilter = button.dataset.filter === 'excluded' ? 'excluded' : 'active'
    render()
  } else if (action === 'promote' && button.dataset.entryId) promoteWord(button.dataset.entryId)
  else if (action === 'exclude' && button.dataset.entryId) excludeWord(button.dataset.entryId)
  else if (action === 'restore' && button.dataset.entryId) restoreWord(button.dataset.entryId)
  else if (action === 'export') downloadProgress()
  else if (action === 'sync-now') void syncCurrentDevice()
  else if (action === 'sync-signout') {
    void signOutOfSync().then(() => {
      syncAccount = null
      notice = 'Cloud sync signed out. This device still keeps its local progress.'
      render()
    }).catch((error: unknown) => {
      notice = errorMessage(error)
      render()
    })
  }
  else if (action === 'reset' && window.confirm('Reset all local progress and custom words?')) {
    state = resetState()
    review = null
    notice = 'Progress reset.'
    render()
  }
})

render()
void restoreSyncSession()
