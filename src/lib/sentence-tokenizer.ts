// Splits story text into speakable chunks for the on-device TTS fallback, tuned to read as
// naturally as a system voice can manage: clause-level pauses at commas/semicolons/dashes,
// longer pauses at sentence and paragraph ends, an extra beat for ellipses, and a slight
// pitch/rate lift for quoted dialogue so it doesn't sound identical to the narration around it.
export interface SentenceToken {
  text: string;
  pauseAfterMs: number;
  pitch: number;
  rate: number;
}

const CLAUSE_PAUSE_MS = 150;
const SENTENCE_PAUSE_MS = 320;
const PARAGRAPH_PAUSE_MS = 650;
const ELLIPSIS_PAUSE_MS = 520;

export const NARRATION_RATE = 0.85;
const NARRATION_PITCH = 1.0;
const DIALOGUE_RATE = 0.9;
const DIALOGUE_PITCH = 1.05;

// Common abbreviations that on-device voices tend to either mispronounce or read as raw
// letters ("Mr." as "em-arr-period"). Expanding them to full words first fixes that outright.
const ABBREVIATIONS: [RegExp, string][] = [
  [/\bMr\./g, 'Mister'],
  [/\bMrs\./g, 'Missus'],
  [/\bMs\./g, 'Miz'],
  [/\bDr\./g, 'Doctor'],
  [/\bProf\./g, 'Professor'],
  [/\bSt\./g, 'Saint'],
  [/\bvs\./g, 'versus'],
  [/\be\.g\./gi, 'for example'],
  [/\bi\.e\./gi, 'that is'],
  [/\betc\./g, 'et cetera'],
];

function normalizeText(text: string): string {
  return ABBREVIATIONS.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text);
}

function isDialogue(sentence: string): boolean {
  const trimmed = sentence.trim();
  return trimmed.startsWith('"') || trimmed.startsWith('“') || trimmed.startsWith("'");
}

function splitParagraphIntoSentences(paragraph: string): string[] {
  const matches = paragraph.match(/[^.!?]+[.!?]+(?=["')\]]*\s|["')\]]*$)["')\]]*|[^.!?]+$/g);
  return (matches ?? [paragraph]).map((s) => s.trim()).filter(Boolean);
}

// Splits after each comma/semicolon/colon/em-dash so a pause lands where a breath naturally
// would, without needing lookbehind regex (not reliably supported across RN's JS engines).
function splitIntoClauses(sentence: string): string[] {
  const clauses: string[] = [];
  let start = 0;
  const delimiter = /[,;:—]/g;
  let match: RegExpExecArray | null;
  while ((match = delimiter.exec(sentence))) {
    clauses.push(sentence.slice(start, match.index + 1));
    start = match.index + 1;
  }
  clauses.push(sentence.slice(start));
  return clauses.map((c) => c.trim()).filter(Boolean);
}

export function tokenizeBody(body: string): SentenceToken[] {
  const normalized = normalizeText(body);
  const paragraphs = normalized
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const tokens: SentenceToken[] = [];

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const sentences = splitParagraphIntoSentences(paragraph);
    sentences.forEach((sentence, sentenceIndex) => {
      const dialogue = isDialogue(sentence);
      const rate = dialogue ? DIALOGUE_RATE : NARRATION_RATE;
      const pitch = dialogue ? DIALOGUE_PITCH : NARRATION_PITCH;
      const isLastSentenceInParagraph = sentenceIndex === sentences.length - 1;
      const isLastParagraph = paragraphIndex === paragraphs.length - 1;
      const clauses = splitIntoClauses(sentence);

      clauses.forEach((clause, clauseIndex) => {
        const isLastClause = clauseIndex === clauses.length - 1;
        let pauseAfterMs: number;
        if (!isLastClause) {
          pauseAfterMs = CLAUSE_PAUSE_MS;
        } else if (/(\.\.\.|…)$/.test(clause)) {
          pauseAfterMs = ELLIPSIS_PAUSE_MS;
        } else if (isLastSentenceInParagraph && !isLastParagraph) {
          pauseAfterMs = PARAGRAPH_PAUSE_MS;
        } else {
          pauseAfterMs = SENTENCE_PAUSE_MS;
        }
        tokens.push({ text: clause, pauseAfterMs, pitch, rate });
      });
    });
  });

  return tokens.length > 0
    ? tokens
    : [{ text: normalized, pauseAfterMs: 0, pitch: NARRATION_PITCH, rate: NARRATION_RATE }];
}
