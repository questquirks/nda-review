const POSTURE_TEXT = {
  discloser: 'We are mainly the DISCLOSING party. Favour strong protection of information.',
  recipient: 'We are mainly the RECEIVING party. Favour light, workable obligations.',
  balanced: 'Both parties disclose roughly equally. Favour market-standard, balanced terms.',
};

const LANG_TEXT = { th: 'Thai', en: 'English' };

const itemProps = {
  id: { type: 'string', description: 'Playbook id' },
  clause: { type: 'string', description: 'Playbook clause name' },
  contract_ref: { type: 'string', description: 'Clause number in the contract, e.g. "9" or "2.5". Empty if missing.' },
  original: { type: 'string', description: 'Exact verbatim excerpt from the contract (shortest excerpt containing the issue). Empty if missing.' },
  status: { type: 'string', enum: ['pass', 'fallback', 'red_flag', 'missing'] },
  revised: { type: 'string', description: 'The excerpt after edits. Same as original if no edit. Full new clause text if missing.' },
  comment_en: { type: 'string', description: 'Short comment to the counterparty in English. Empty if pass.' },
  note: { type: 'string', description: 'Short internal explanation in the requested language.' },
};
const itemRequired = Object.keys(itemProps);

const uncoveredSchema = {
  type: 'array',
  description: 'Contract clauses not covered by the playbook that a lawyer should look at.',
  items: {
    type: 'object',
    properties: {
      contract_ref: { type: 'string' },
      issue: { type: 'string', description: 'Issue in the requested language' },
    },
    required: ['contract_ref', 'issue'],
  },
};

export const reviewTool = {
  name: 'submit_review',
  description: 'Submit the clause-by-clause NDA review.',
  input_schema: {
    type: 'object',
    properties: {
      items: { type: 'array', items: { type: 'object', properties: itemProps, required: itemRequired } },
      uncovered: uncoveredSchema,
    },
    required: ['items', 'uncovered'],
  },
};

export const verifyTool = {
  name: 'submit_verified_review',
  description: 'Submit the checked and corrected NDA review.',
  input_schema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            ...itemProps,
            check: { type: 'string', enum: ['confirmed', 'corrected'] },
            check_note: { type: 'string', description: 'What was corrected and why, in the requested language. Empty if confirmed.' },
          },
          required: [...itemRequired, 'check', 'check_note'],
        },
      },
      uncovered: uncoveredSchema,
    },
    required: ['items', 'uncovered'],
  },
};

const RULES = `Status rules:
- pass: the contract meets Preferred. revised = original. comment_en empty.
- fallback: meets Fallback but not Preferred. Propose an edit toward Preferred; the note must say the edit is optional.
- red_flag: worse than Fallback or matches Red flag. Propose a required edit.
- missing: the contract has no such clause. original empty; revised = a new concise clause.

Drafting rules:
- Edit minimally and concisely. Change only the words needed; keep the rest of the excerpt identical.
- Use the contract's own defined terms (e.g. "Disclosing Party", "Receiving Party", "Purpose").
- Use the playbook Sample language as the basis where it fits.
- In a mutual NDA every obligation also binds us. Do not propose terms we could not comply with ourselves.
- original must be copied character-for-character from the contract.
- comment_en: 1-2 sentences, polite, based on the playbook Rationale.
- Items with posture "all" apply regardless of posture.`;

export function buildReview({ posture, lang, playbook, contractText }) {
  return {
    tool: reviewTool,
    system: `You are a senior commercial lawyer reviewing a mutual NDA against a playbook.
Our posture: ${POSTURE_TEXT[posture]}
Write "note" and "uncovered.issue" in ${LANG_TEXT[lang]}.
Return exactly one item for every playbook item, in playbook order.

${RULES}`,
    user: `<playbook>\n${JSON.stringify(playbook, null, 1)}\n</playbook>\n\n<contract>\n${contractText}\n</contract>`,
  };
}

export function buildVerify({ posture, lang, playbook, contractText, review, flags }) {
  return {
    tool: verifyTool,
    system: `You are a second, independent lawyer checking a colleague's review of a mutual NDA.
Our posture: ${POSTURE_TEXT[posture]}
Write "note", "check_note" and "uncovered.issue" in ${LANG_TEXT[lang]}.

For every item check:
1. original is verbatim from the contract and is the correct clause for that playbook item.
2. status is correct under the playbook for this posture.
3. revised is a minimal, grammatical edit that uses the contract's defined terms and is consistent with the other edits (e.g. term, survival and personal data provisions must not conflict).
4. comment_en and note are accurate.
5. no playbook item is missing, and uncovered lists any important contract clause the playbook does not cover.
Fix every problem, including the automated flags below. Return the full corrected list, one item per playbook item, in playbook order. Mark each item confirmed or corrected.

${RULES}`,
    user: `<playbook>\n${JSON.stringify(playbook, null, 1)}\n</playbook>\n\n<contract>\n${contractText}\n</contract>\n\n<first_review>\n${JSON.stringify(review, null, 1)}\n</first_review>\n\n<automated_flags>\n${flags.length ? flags.join('\n') : 'None'}\n</automated_flags>`,
  };
}
