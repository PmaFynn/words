import type { Language, WordEntry } from '../types'

interface SeedSpec {
  term: string
  counterpart: string
  partOfSpeech: string
  definitions: string[]
  etymology: string
  example: string
  tags: string[]
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function createSeedEntry(language: Language, spec: SeedSpec): WordEntry {
  const markerCount = spec.example.split('{{gap}}').length - 1
  if (markerCount !== 1) {
    throw new Error(`Seed example for ${spec.term} must contain exactly one {{gap}} marker.`)
  }

  return {
    id: `${language.slice(0, 2)}-${slug(spec.term)}`,
    language,
    term: spec.term,
    counterpart: spec.counterpart,
    definitions: spec.definitions,
    etymology: spec.etymology,
    partOfSpeech: spec.partOfSpeech,
    tags: spec.tags,
    example: spec.example.replace('{{gap}}', spec.term),
    cloze: spec.example.replace('{{gap}}', '_____'),
    acceptedAnswers: [spec.term],
    source: { label: 'Hand-authored starter corpus', modified: true },
    custom: false,
  }
}

const englishSpecs: SeedSpec[] = ([
  ['equivocal', 'mehrdeutig', 'adjective', ['Open to more than one interpretation; uncertain.'], 'From Latin aequivocus, “of equal voice.”', 'The witness gave an {{gap}} answer, leaving the jury unsure.', ['judgment', 'clarity']],
  ['mitigate', 'mildern', 'verb', ['To make something less severe, harmful, or painful.'], 'From Latin mitigare, “to make mild.”', 'The new policy should {{gap}} the pressure on small teams.', ['change', 'argument']],
  ['scrutinize', 'prüfen', 'verb', ['To examine something closely and critically.'], 'From Latin scrutari, “to search through rubbish.”', 'The editor will {{gap}} every claim before publication.', ['analysis', 'judgment']],
  ['ubiquitous', 'allgegenwärtig', 'adjective', ['Present, appearing, or found everywhere.'], 'From Latin ubique, “everywhere.”', 'Smartphones are now {{gap}} in everyday life.', ['society', 'description']],
  ['pragmatic', 'pragmatisch', 'adjective', ['Focused on practical results rather than theory.'], 'From Greek pragma, “deed” or “thing done.”', 'We need a {{gap}} solution that works within the budget.', ['work', 'decision']],
  ['coherent', 'kohärent', 'adjective', ['Logical, consistent, and easy to understand as a whole.'], 'From Latin cohaerere, “to stick together.”', 'Her argument was clear and {{gap}} from beginning to end.', ['argument', 'clarity']],
  ['nuanced', 'nuanciert', 'adjective', ['Showing subtle distinctions or variations.'], 'From French nuance, “shade of meaning.”', 'The report offers a {{gap}} view of the dispute.', ['analysis', 'description']],
  ['ostensibly', 'angeblich', 'adverb', ['Apparently or according to what is stated, though possibly not truly.'], 'From Latin ostendere, “to show.”', 'The meeting was {{gap}} about budgets, but politics shaped it.', ['judgment', 'society']],
  ['anomalous', 'anomal', 'adjective', ['Different from what is normal, expected, or usual.'], 'From Greek anomalia, “unevenness.”', 'The unusually high result was {{gap}} and needed checking.', ['analysis', 'science']],
  ['salient', 'ausschlaggebend', 'adjective', ['Most noticeable or important.'], 'From Latin salire, “to leap.”', 'The most {{gap}} point is the lack of reliable evidence.', ['argument', 'judgment']],
  ['inadvertent', 'unbeabsichtigt', 'adjective', ['Not resulting from deliberate intention.'], 'From Latin advertere, “to turn toward,” with a negative prefix.', 'The email contained an {{gap}} disclosure of private details.', ['work', 'ethics']],
  ['tentative', 'vorläufig', 'adjective', ['Not certain or final; provisional.'], 'From Latin tentare, “to try” or “test.”', 'We reached a {{gap}} agreement pending legal review.', ['work', 'decision']],
  ['plausible', 'plausibel', 'adjective', ['Seeming reasonable or likely to be true.'], 'From Latin plausibilis, “deserving applause.”', 'The researcher proposed a {{gap}} explanation for the pattern.', ['analysis', 'argument']],
  ['meticulous', 'sorgfältig', 'adjective', ['Very careful and precise about details.'], 'From Latin meticulosus, “fearful” or “overly careful.”', 'His {{gap}} notes made the experiment easy to reproduce.', ['work', 'description']],
  ['exacerbate', 'verschärfen', 'verb', ['To make a problem or bad situation worse.'], 'From Latin exacerbare, “to make harsh.”', 'A rushed response could {{gap}} the conflict.', ['change', 'society']],
  ['discern', 'erkennen', 'verb', ['To perceive or recognize something, often with difficulty.'], 'From Latin discernere, “to separate.”', 'It took time to {{gap}} the pattern in the noisy data.', ['analysis', 'perception']],
  ['articulate', 'artikulieren', 'verb', ['To express an idea clearly and effectively.'], 'From Latin articulus, “joint” or “division.”', 'She could {{gap}} the concern without blaming anyone.', ['communication', 'work']],
  ['conundrum', 'Dilemma', 'noun', ['A confusing and difficult problem or question.'], 'From a sixteenth-century invented word, perhaps imitating Latin.', 'The team faced a {{gap}} with no obvious compromise.', ['decision', 'argument']],
  ['benevolent', 'wohlwollend', 'adjective', ['Kind, generous, and intending to do good.'], 'From Latin bene, “well,” and volens, “wishing.”', 'The foundation has a {{gap}} aim but limited resources.', ['ethics', 'society']],
  ['candid', 'offen', 'adjective', ['Truthful and direct, even when that is uncomfortable.'], 'From Latin candidus, “white” or “bright.”', 'Her {{gap}} feedback helped us improve the proposal.', ['communication', 'ethics']],
  ['cumulative', 'kumulativ', 'adjective', ['Increasing through the addition of successive parts.'], 'From Latin cumulatus, “heaped up.”', 'The {{gap}} effect of small delays became significant.', ['change', 'analysis']],
  ['detrimental', 'schädlich', 'adjective', ['Causing harm or damage.'], 'From Latin detrimentum, “loss” or “damage.”', 'Constant interruptions are {{gap}} to deep work.', ['work', 'judgment']],
  ['empirical', 'empirisch', 'adjective', ['Based on observation or experiment rather than theory alone.'], 'From Greek empeirikos, “experienced.”', 'The claim needs {{gap}} support before we accept it.', ['science', 'analysis']],
  ['feasible', 'durchführbar', 'adjective', ['Possible and practical to achieve.'], 'From Latin facere, “to do” or “make.”', 'The proposal is ambitious but technically {{gap}}.', ['work', 'decision']],
  ['futile', 'vergeblich', 'adjective', ['Unable to produce a useful result; pointless.'], 'From Latin futilis, “leaky” or “vain.”', 'Arguing about the old version is now {{gap}}.', ['judgment', 'change']],
  ['impartial', 'unparteiisch', 'adjective', ['Not favoring one side over another.'], 'From Latin in-, “not,” and pars, “part.”', 'An {{gap}} chairperson helped both groups be heard.', ['ethics', 'society']],
  ['inherent', 'inhärent', 'adjective', ['Existing as a natural or essential part of something.'], 'From Latin inhaerere, “to stick in.”', 'Every measurement has some {{gap}} uncertainty.', ['science', 'description']],
  ['innovate', 'innovieren', 'verb', ['To introduce a new idea, method, or product.'], 'From Latin innovare, “to renew.”', 'Small companies often {{gap}} faster than large ones.', ['change', 'work']],
  ['juxtapose', 'gegenüberstellen', 'verb', ['To place things close together for comparison or contrast.'], 'From Latin juxta, “near,” and French poser, “to place.”', 'The exhibition will {{gap}} old maps with satellite images.', ['description', 'analysis']],
  ['lucid', 'klar', 'adjective', ['Clear and easy to understand.'], 'From Latin lucidus, “light” or “bright.”', 'The lecturer gave a {{gap}} explanation of the process.', ['clarity', 'communication']],
  ['mediocre', 'mittelmäßig', 'adjective', ['Of only average or low quality.'], 'From Latin mediocris, “middling.”', 'The first draft was {{gap}}, but the revision improved it.', ['judgment', 'work']],
  ['paradoxical', 'paradox', 'adjective', ['Seemingly contradictory but perhaps true.'], 'From Greek paradoxos, “contrary to expectation.”', 'It is {{gap}} that more choice can create less freedom.', ['argument', 'description']],
  ['prudent', 'umsichtig', 'adjective', ['Acting with careful judgment and foresight.'], 'From Latin prudens, “foreseeing.”', 'It would be {{gap}} to keep a backup copy.', ['decision', 'work']],
  ['resilient', 'widerstandsfähig', 'adjective', ['Able to recover quickly from difficulty.'], 'From Latin resilire, “to spring back.”', 'The {{gap}} team adapted after the launch failed.', ['change', 'work']],
  ['rigorous', 'streng', 'adjective', ['Extremely thorough, exact, and demanding.'], 'From Latin rigor, “stiffness.”', 'The study followed a {{gap}} review process.', ['science', 'analysis']],
  ['substantiate', 'belegen', 'verb', ['To support a claim with evidence.'], 'From Latin substantia, “substance.”', 'The author must {{gap}} the conclusion with sources.', ['argument', 'science']],
  ['superficial', 'oberflächlich', 'adjective', ['Concerned only with what is obvious or apparent.'], 'From Latin superficies, “surface.”', 'The interview offered a {{gap}} understanding of the issue.', ['analysis', 'judgment']],
  ['transparent', 'transparent', 'adjective', ['Open, clear, and easy to understand or inspect.'], 'From Latin transparere, “to shine through.”', 'The organization published a {{gap}} account of its spending.', ['ethics', 'society']],
  ['ambiguous', 'mehrdeutig', 'adjective', ['Open to more than one interpretation.'], 'From Latin ambiguus, “wandering” or “uncertain.”', 'The contract contains an {{gap}} clause about ownership.', ['communication', 'law']],
  ['eloquent', 'wortgewandt', 'adjective', ['Fluent or persuasive in speaking or writing.'], 'From Latin eloqui, “to speak out.”', 'Her {{gap}} explanation changed the committee’s mind.', ['communication', 'work']],
  ['inevitable', 'unvermeidlich', 'adjective', ['Certain to happen; unavoidable.'], 'From Latin inevitabilis, “unavoidable.”', 'Some degree of uncertainty is {{gap}} in research.', ['change', 'science']],
  ['viable', 'lebensfähig', 'adjective', ['Capable of working successfully or continuing to exist.'], 'From French vie, “life.”', 'We need a {{gap}} plan before we announce the project.', ['work', 'decision']],
  ['reluctant', 'widerwillig', 'adjective', ['Unwilling or hesitant.'], 'From Latin reluctari, “to struggle against.”', 'The board was {{gap}} to approve the unusual expense.', ['decision', 'society']],
  ['robust', 'robust', 'adjective', ['Strong, healthy, or unlikely to fail.'], 'From Latin robustus, “oaken” or “strong.”', 'The service needs a {{gap}} backup strategy.', ['work', 'technology']],
  ['arbitrary', 'willkürlich', 'adjective', ['Based on personal choice rather than a clear reason.'], 'From Latin arbitrarius, “depending on judgment.”', 'The deadline feels {{gap}} because no reason was given.', ['judgment', 'work']],
  ['conspicuous', 'auffällig', 'adjective', ['Clearly visible or attracting attention.'], 'From Latin conspicere, “to look at.”', 'The error was {{gap}} in the final report.', ['description', 'judgment']],
  ['deferential', 'ehrerbietig', 'adjective', ['Showing respectful submission or regard.'], 'From Latin deferre, “to carry down” or “submit.”', 'The intern was polite but not excessively {{gap}}.', ['society', 'communication']],
  ['disparate', 'unterschiedlich', 'adjective', ['Fundamentally different or unrelated.'], 'From Latin dispar, “unequal.”', 'The study combines data from {{gap}} sources.', ['analysis', 'description']],
  ['intricate', 'kompliziert', 'adjective', ['Very complicated or detailed.'], 'From Latin intricare, “to entangle.”', 'The machine has an {{gap}} internal mechanism.', ['description', 'technology']],
  ['pervasive', 'allgegenwärtig', 'adjective', ['Spreading widely throughout an area or group.'], 'From Latin pervadere, “to spread through.”', 'Advertising has a {{gap}} influence on public attention.', ['society', 'description']],
 ] as const).map((item) => ({
  term: item[0], counterpart: item[1], partOfSpeech: item[2], definitions: [...item[3]], etymology: item[4], example: item[5], tags: [...item[6]],
}))

const germanSpecs: SeedSpec[] = ([
  ['intendieren', 'to intend', 'Verb', ['Etwas beabsichtigen oder als Ziel verfolgen.'], 'Vom lateinischen intendere, „richten auf“.', 'Die Formulierung {{gap}} eine vorsichtige Kritik.', ['Kommunikation', 'Urteil']],
  ['abwägen', 'to weigh up', 'Verb', ['Möglichkeiten sorgfältig vergleichen, bevor man entscheidet.'], 'Zusammensetzung aus ab- und wägen.', 'Vor der Entscheidung muss man die Folgen {{gap}}.', ['Entscheidung', 'Urteil']],
  ['nachvollziehbar', 'comprehensible', 'Adjektiv', ['So klar, dass ein Gedankengang verstanden werden kann.'], 'Zusammensetzung aus nach- und vollziehbar.', 'Die Begründung ist trotz der Kritik {{gap}}.', ['Kommunikation', 'Klarheit']],
  ['prägnant', 'concise', 'Adjektiv', ['Kurz, klar und einprägsam formuliert.'], 'Aus lateinisch praegnans, „voll“ oder „reichhaltig“.', 'Der Autor fasst das Ergebnis {{gap}} zusammen.', ['Kommunikation', 'Klarheit']],
  ['ambivalent', 'ambivalent', 'Adjektiv', ['Zwiespältig oder von widersprüchlichen Gefühlen geprägt.'], 'Aus lateinisch ambivalere, „beide Seiten haben“.', 'Seine {{gap}} Reaktion ließ keine eindeutige Haltung erkennen.', ['Urteil', 'Gesellschaft']],
  ['kontrovers', 'controversial', 'Adjektiv', ['Umstritten und Anlass für unterschiedliche Meinungen.'], 'Aus lateinisch controversus, „entgegengesetzt“.', 'Die Entscheidung bleibt politisch {{gap}}.', ['Gesellschaft', 'Urteil']],
  ['konzis', 'concise', 'Adjektiv', ['Knapp und dennoch inhaltlich vollständig.'], 'Aus lateinisch concisus, „abgeschnitten“.', 'Der Bericht ist sachlich und {{gap}}.', ['Kommunikation', 'Klarheit']],
  ['sukzessive', 'successively', 'Adverb', ['Schrittweise oder aufeinanderfolgend.'], 'Aus lateinisch succedere, „nachfolgen“.', 'Die Änderungen wurden {{gap}} eingeführt.', ['Veränderung', 'Arbeit']],
  ['dezidiert', 'decided', 'Adjektiv', ['Entschieden und ausdrücklich formuliert.'], 'Aus lateinisch decidere, „entscheiden“.', 'Sie vertrat eine {{gap}} Position gegen den Vorschlag.', ['Urteil', 'Kommunikation']],
  ['implizit', 'implicit', 'Adjektiv', ['Mitgemeint, ohne ausdrücklich ausgesprochen zu werden.'], 'Aus lateinisch implicare, „verflechten“.', 'In seiner Antwort lag eine {{gap}} Kritik.', ['Kommunikation', 'Analyse']],
  ['explizit', 'explicit', 'Adjektiv', ['Ausdrücklich und eindeutig formuliert.'], 'Aus lateinisch explicare, „entfalten“ oder „erklären“.', 'Die Anleitung nennt das Ziel {{gap}}.', ['Kommunikation', 'Klarheit']],
  ['kohärent', 'coherent', 'Adjektiv', ['In sich schlüssig und zusammenhängend.'], 'Aus lateinisch cohaerere, „zusammenhängen“.', 'Die Argumentation wirkt {{gap}} und gut begründet.', ['Argument', 'Klarheit']],
  ['redundant', 'redundant', 'Adjektiv', ['Überflüssig, weil eine Information mehrfach vorhanden ist.'], 'Aus lateinisch redundare, „überströmen“.', 'Der letzte Absatz ist inhaltlich {{gap}}.', ['Analyse', 'Arbeit']],
  ['paradigmatisch', 'paradigmatic', 'Adjektiv', ['Als typisches oder beispielhaftes Muster dienend.'], 'Aus griechisch paradeigma, „Beispiel“.', 'Der Fall ist {{gap}} für diesen Wandel.', ['Analyse', 'Beschreibung']],
  ['exemplarisch', 'exemplary', 'Adjektiv', ['Als Beispiel besonders geeignet oder vorbildlich.'], 'Aus lateinisch exemplum, „Beispiel“.', 'Der Bericht zeigt {{gap}}, wie der Fehler entstand.', ['Beschreibung', 'Arbeit']],
  ['marginal', 'marginal', 'Adjektiv', ['Am Rand liegend oder von geringer Bedeutung.'], 'Aus lateinisch margo, „Rand“.', 'Der Unterschied ist für das Ergebnis {{gap}}.', ['Urteil', 'Analyse']],
  ['evident', 'evident', 'Adjektiv', ['Offensichtlich und unmittelbar einleuchtend.'], 'Aus lateinisch evidens, „offenkundig“.', 'Nach den neuen Daten ist der Zusammenhang {{gap}}.', ['Analyse', 'Wissenschaft']],
  ['obsolet', 'obsolete', 'Adjektiv', ['Nicht mehr zeitgemäß oder gebräuchlich.'], 'Aus lateinisch obsolescere, „veralten“.', 'Diese Methode ist inzwischen {{gap}}.', ['Veränderung', 'Arbeit']],
  ['präjudizieren', 'prejudge', 'Verb', ['Eine Entscheidung oder Bewertung vorwegnehmen.'], 'Aus lateinisch praeiudicare, „vorher urteilen“.', 'Die Überschrift darf das Ergebnis nicht {{gap}}.', ['Urteil', 'Recht']],
  ['reziprok', 'reciprocal', 'Adjektiv', ['Gegenseitig oder wechselseitig.'], 'Aus lateinisch reciprocus, „zurückkehrend“.', 'Die beiden Staaten gingen eine {{gap}} Vereinbarung ein.', ['Gesellschaft', 'Beziehung']],
  ['autonom', 'autonomous', 'Adjektiv', ['Selbstständig und unabhängig entscheidend.'], 'Aus griechisch autonomos, „sich selbst Gesetze gebend“.', 'Die Abteilung arbeitet weitgehend {{gap}}.', ['Arbeit', 'Gesellschaft']],
  ['signifikant', 'significant', 'Adjektiv', ['Bedeutsam oder statistisch auffällig.'], 'Aus lateinisch significare, „bezeichnen“.', 'Der Unterschied ist statistisch {{gap}}.', ['Wissenschaft', 'Analyse']],
  ['konstatieren', 'to state', 'Verb', ['Etwas sachlich feststellen oder feststellen müssen.'], 'Aus lateinisch constat, „es steht fest“.', 'Die Studie {{gap}} einen deutlichen Rückgang.', ['Wissenschaft', 'Kommunikation']],
  ['postulieren', 'to postulate', 'Verb', ['Etwas als Voraussetzung oder Forderung aufstellen.'], 'Aus lateinisch postulare, „fordern“.', 'Das Modell {{gap}} eine stabile Umgebung.', ['Wissenschaft', 'Argument']],
  ['legitimieren', 'to legitimize', 'Verb', ['Etwas rechtfertigen oder als berechtigt anerkennen.'], 'Aus lateinisch legitimus, „gesetzmäßig“.', 'Die Zahlen sollen die Reform {{gap}}.', ['Argument', 'Recht']],
  ['relativieren', 'to put into perspective', 'Verb', ['Die Bedeutung einer Aussage einschränken oder in Beziehung setzen.'], 'Aus lateinisch relativus, „bezüglich“.', 'Die neuen Fakten {{gap}} den ersten Eindruck.', ['Analyse', 'Urteil']],
  ['subsumieren', 'to subsume', 'Verb', ['Etwas einer übergeordneten Kategorie zuordnen.'], 'Aus lateinisch subsumere, „darunternehmen“.', 'Man kann die Beispiele unter einem Begriff {{gap}}.', ['Analyse', 'Beschreibung']],
  ['divergieren', 'to diverge', 'Verb', ['Sich auseinanderentwickeln oder voneinander abweichen.'], 'Aus lateinisch divergere, „auseinanderstreben“.', 'Die beiden Prognosen {{gap}} bei den langfristigen Kosten.', ['Analyse', 'Veränderung']],
  ['resultieren', 'to result', 'Verb', ['Sich als Folge aus etwas ergeben.'], 'Aus lateinisch resultare, „zurückspringen“.', 'Die Verzögerung {{gap}} aus einem fehlenden Bauteil.', ['Veränderung', 'Argument']],
  ['insistieren', 'to insist', 'Verb', ['Auf etwas bestehen oder eine Forderung nachdrücklich wiederholen.'], 'Aus lateinisch insistire, „auf etwas stehen“.', 'Die Kundin {{gap}} auf einer schriftlichen Antwort.', ['Kommunikation', 'Urteil']],
  ['profan', 'profane', 'Adjektiv', ['Weltlich oder nicht religiös; manchmal auch gewöhnlich.'], 'Aus lateinisch profanus, „vor dem Heiligtum“.', 'Der Text verbindet religiöse und {{gap}} Bilder.', ['Gesellschaft', 'Beschreibung']],
  ['eloquent', 'eloquent', 'Adjektiv', ['Sprachlich gewandt und überzeugend.'], 'Aus lateinisch eloqui, „aussprechen“.', 'Die {{gap}} Rede überzeugte auch Skeptiker.', ['Kommunikation', 'Arbeit']],
  ['inadäquat', 'inadequate', 'Adjektiv', ['Nicht angemessen oder der Situation nicht entsprechend.'], 'Aus lateinisch adaequatus, „angeglichen“, mit Verneinung.', 'Die knappe Antwort war für die Frage {{gap}}.', ['Urteil', 'Kommunikation']],
  ['ambig', 'ambiguous', 'Adjektiv', ['Mehrdeutig oder auf verschiedene Weise deutbar.'], 'Aus lateinisch ambiguus, „zweideutig“.', 'Die Anweisung bleibt sprachlich {{gap}}.', ['Kommunikation', 'Klarheit']],
  ['prävalent', 'prevalent', 'Adjektiv', ['Vorherrschend oder besonders häufig vorkommend.'], 'Aus lateinisch praevalere, „überwiegen“.', 'In der Branche ist diese Annahme besonders {{gap}}.', ['Gesellschaft', 'Analyse']],
  ['konstitutiv', 'constitutive', 'Adjektiv', ['Etwas grundlegend bildend oder bestimmend.'], 'Aus lateinisch constituere, „festsetzen“.', 'Vertrauen ist für die Zusammenarbeit {{gap}}.', ['Gesellschaft', 'Beschreibung']],
  ['intrinsisch', 'intrinsic', 'Adjektiv', ['In einer Sache selbst liegend und nicht von außen verursacht.'], 'Aus lateinisch intrinsecus, „innerlich“.', 'Die Motivation ist nicht nur finanziell, sondern {{gap}}.', ['Urteil', 'Arbeit']],
  ['dezimieren', 'to decimate', 'Verb', ['Etwas stark verringern oder erheblich reduzieren.'], 'Aus lateinisch decimare, „jeden Zehnten nehmen“.', 'Die Krise hat die Bestände deutlich {{gap}}.', ['Veränderung', 'Gesellschaft']],
  ['restriktiv', 'restrictive', 'Adjektiv', ['Einschränkend oder wenig Spielraum lassend.'], 'Aus lateinisch restringere, „fest anziehen“.', 'Die {{gap}} Regelung erschwert den Zugang.', ['Recht', 'Gesellschaft']],
  ['adaptiv', 'adaptive', 'Adjektiv', ['Fähig, sich an neue Bedingungen anzupassen.'], 'Aus lateinisch adaptare, „anpassen“.', 'Ein {{gap}} System reagiert auf veränderte Anforderungen.', ['Veränderung', 'Technik']],
  ['disparat', 'disparate', 'Adjektiv', ['Ungleichartig oder schwer miteinander vereinbar.'], 'Aus lateinisch dispar, „ungleich“.', 'Die Gruppe verfolgt teilweise {{gap}} Interessen.', ['Gesellschaft', 'Urteil']],
  ['stringent', 'stringent', 'Adjektiv', ['Streng folgerichtig und überzeugend aufgebaut.'], 'Aus lateinisch stringere, „zusammenziehen“.', 'Die Argumentation ist klar und {{gap}}.', ['Argument', 'Klarheit']],
  ['kumulativ', 'cumulative', 'Adjektiv', ['Sich durch schrittweise Addition verstärkend.'], 'Aus lateinisch cumulus, „Haufen“.', 'Die {{gap}} Wirkung kleiner Fehler wurde unterschätzt.', ['Veränderung', 'Analyse']],
  ['inhärent', 'inherent', 'Adjektiv', ['Einer Sache von ihrem Wesen her innewohnend.'], 'Aus lateinisch inhaerere, „anhaften“.', 'Das Verfahren hat ein {{gap}} Risiko.', ['Analyse', 'Urteil']],
  ['substanziell', 'substantial', 'Adjektiv', ['Wesentlich, erheblich oder von großer Bedeutung.'], 'Aus lateinisch substantia, „Wesen“ oder „Bestand“.', 'Die Reform brachte {{gap}} Verbesserungen.', ['Veränderung', 'Urteil']],
  ['apodiktisch', 'apodictic', 'Adjektiv', ['Mit dem Anspruch unbedingter Gewissheit auftretend.'], 'Aus griechisch apodeiktikos, „beweisend“.', 'Seine {{gap}} Behauptung ließ keinen Widerspruch zu.', ['Argument', 'Kommunikation']],
  ['kontextuell', 'contextual', 'Adjektiv', ['Den Zusammenhang oder die Umstände einer Sache betreffend.'], 'Aus lateinisch contextus, „Verbindung“ oder „Zusammenhang“.', 'Die Aussage ist nur {{gap}} verständlich.', ['Analyse', 'Kommunikation']],
  ['proportional', 'proportional', 'Adjektiv', ['In einem bestimmten Verhältnis stehend oder entsprechend.'], 'Aus lateinisch proportio, „Verhältnis“.', 'Die Reaktion sollte {{gap}} zur Ursache bleiben.', ['Urteil', 'Entscheidung']],
  ['teleologisch', 'teleological', 'Adjektiv', ['Auf einen Zweck oder ein Ziel bezogen.'], 'Aus griechisch telos, „Ziel“, und logos, „Lehre“.', 'Die Erklärung ist eher {{gap}} als historisch.', ['Analyse', 'Argument']],
  ['kontingent', 'contingent', 'Adjektiv', ['Nicht notwendig, sondern von Umständen abhängig.'], 'Aus lateinisch contingere, „zufallen“ oder „sich ereignen“.', 'Der Erfolg war teilweise {{gap}} und nicht planbar.', ['Veränderung', 'Urteil']],
 ] as const).map((item) => ({
  term: item[0], counterpart: item[1], partOfSpeech: item[2], definitions: [...item[3]], etymology: item[4], example: item[5], tags: [...item[6]],
}))

export const seedEntries: WordEntry[] = [
  ...englishSpecs.map((spec) => createSeedEntry('english', spec)),
  ...germanSpecs.map((spec) => createSeedEntry('german', spec)),
]