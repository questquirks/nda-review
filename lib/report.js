// สร้างรายงานผลรีวิวเป็นไฟล์ Word (.docx) ในเบราว์เซอร์ ไม่ต้องเรียก AI ซ้ำ
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle,
} from 'docx';
import { wordDiff } from './diff.js';

const L = {
  th: {
    title: 'รายงานผลรีวิว NDA',
    file: 'ไฟล์สัญญา', side: 'ฝั่งของเรา', date: 'วันที่รีวิว', summary: 'สรุป',
    accepted: 'ข้อที่ขอแก้ไข (รับแล้ว)', noneAccepted: 'ยังไม่ได้เลือกรับข้อใด',
    clause: 'ข้อ', newClause: 'ข้อใหม่', deleteClause: '[ลบทั้งข้อ]',
    comment: 'Comment to counterparty', note: 'คำอธิบายภายใน', edited: '(แก้ข้อความโดยผู้ตรวจ)',
    notAccepted: 'ข้อที่ไม่รับ หรือยังไม่ได้ตัดสินใจ', passed: 'ข้อที่ผ่านแล้ว',
    uncovered: 'ข้ออื่นที่ guideline ไม่ครอบคลุม', general: 'ทั่วไป',
    rejected: 'ไม่รับ', undecided: 'ยังไม่ตัดสินใจ',
    disclaimer: 'รายงานนี้รีวิวตามหลักการพื้นฐานของสัญญาเท่านั้น ผลลัพธ์เป็นเพียงร่าง และจำเป็นต้องให้ฝ่ายกฎหมายตรวจก่อนใช้งานเสมอ',
  },
  en: {
    title: 'NDA Review Report',
    file: 'Contract file', side: 'Our side', date: 'Review date', summary: 'Summary',
    accepted: 'Requested changes (accepted)', noneAccepted: 'No changes have been accepted yet.',
    clause: 'Clause', newClause: 'New clause', deleteClause: '[Delete clause]',
    comment: 'Comment to counterparty', note: 'Internal note', edited: '(edited by reviewer)',
    notAccepted: 'Rejected or undecided items', passed: 'Items that pass',
    uncovered: 'Other clauses not covered by the guideline', general: 'General',
    rejected: 'Rejected', undecided: 'Undecided',
    disclaimer: 'This report reviews the NDA against basic contract principles only. The output is a draft and must always be reviewed by the legal team before use.',
  },
};

const FONT = 'Arial';
const p = (children, opts = {}) => new Paragraph({ spacing: { after: 120 }, ...opts, children });
const run = (text, opts = {}) => new TextRun({ text, font: FONT, size: 21, ...opts });
const label = text => p([run(text, { bold: true, size: 18, color: '5A6573' })], { spacing: { before: 120, after: 40 } });

function redlineRuns(original, revised) {
  return wordDiff(original || '', revised || '').map(part =>
    part.type === 'del' ? run(part.text, { strike: true, color: 'B42318' })
      : part.type === 'ins' ? run(part.text, { bold: true, color: '174EA6' })
        : run(part.text));
}

export async function buildReport({ ui, fileName, sideTitle, statusLabels, order, items, decisions, edits, uncovered = [] }) {
  const l = L[ui] || L.en;
  const revisedOf = it => edits[it.id] ?? it.revised;
  const ref = it => (it.contract_ref ? `${l.clause} ${it.contract_ref}` : l.newClause);
  const toFix = items.filter(i => i.status !== 'pass');
  const accepted = toFix.filter(i => decisions[i.id] === 'accepted');
  const others = toFix.filter(i => decisions[i.id] !== 'accepted');
  const passed = items.filter(i => i.status === 'pass');
  const date = new Date().toLocaleDateString(ui === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const body = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [run(l.title, { size: 36, bold: true })], spacing: { after: 200 } }),
    p([run(`${l.file}: `, { bold: true }), run(fileName)]),
    p([run(`${l.side}: `, { bold: true }), run(sideTitle)]),
    p([run(`${l.date}: `, { bold: true }), run(date)]),
    p([run(`${l.summary}: `, { bold: true }), run(order.map(s => `${statusLabels[s]} ${items.filter(i => i.status === s).length}`).join('  ·  '))]),
    p([run(l.disclaimer, { italics: true, color: '5A6573', size: 19 })], {
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'D5DBE2', space: 6 }, bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D5DBE2', space: 6 } },
      spacing: { before: 160, after: 240 },
    }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [run(l.accepted, { size: 28, bold: true })], spacing: { before: 240, after: 120 } }),
  ];

  if (!accepted.length) body.push(p([run(l.noneAccepted, { italics: true })]));

  accepted.forEach((it, idx) => {
    const revised = revisedOf(it);
    const isEdited = edits[it.id] !== undefined && edits[it.id] !== it.revised;
    body.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 280, after: 80 },
      children: [run(`${idx + 1}. ${it.clause} (${ref(it)})`, { size: 24, bold: true }), run(`   ${statusLabels[it.status]}`, { size: 18, color: 'B42318' })],
    }));
    const runs = it.original && !revised ? [run(it.original, { strike: true, color: 'B42318' }), run(`  ${l.deleteClause}`, { bold: true, color: '174EA6' })]
      : !it.original ? [run(revised, { bold: true, color: '174EA6' })]
        : redlineRuns(it.original, revised);
    body.push(p(runs, { indent: { left: 360 }, border: { left: { style: BorderStyle.SINGLE, size: 12, color: 'D5DBE2', space: 8 } } }));
    if (isEdited) body.push(p([run(l.edited, { italics: true, size: 18, color: '5A6573' })], { indent: { left: 360 } }));
    if (it.comment_en) { body.push(label(l.comment)); body.push(p([run(it.comment_en, { italics: true })])); }
    if (it.note) { body.push(label(l.note)); body.push(p([run(it.note)])); }
  });

  if (others.length) {
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [run(l.notAccepted, { size: 28, bold: true })], spacing: { before: 360, after: 120 } }));
    others.forEach(it => body.push(p([
      run(it.contract_ref ? `${it.clause} (${l.clause} ${it.contract_ref})` : it.clause, { bold: true }),
      run(` — ${statusLabels[it.status]} · ${decisions[it.id] === 'rejected' ? l.rejected : l.undecided}`),
    ])));
  }

  if (passed.length) {
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [run(l.passed, { size: 28, bold: true })], spacing: { before: 360, after: 120 } }));
    body.push(p([run(passed.map(i => i.clause).join(', '))]));
  }

  if (uncovered.length) {
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [run(l.uncovered, { size: 28, bold: true })], spacing: { before: 360, after: 120 } }));
    uncovered.forEach(u => body.push(p([run(`${u.contract_ref ? `${l.clause} ${u.contract_ref}` : l.general}: `, { bold: true }), run(u.issue)])));
  }

  return new Document({
    creator: '', title: l.title,
    styles: { default: { document: { run: { font: FONT, size: 21 } } } },
    sections: [{ properties: { page: { margin: { top: 1200, bottom: 1200, left: 1200, right: 1200 } } }, children: body }],
  });
}

export async function downloadReport(args) {
  const doc = await buildReport(args);
  const blob = await Packer.toBlob(doc);
  const base = (args.fileName || 'NDA').replace(/\.docx?$/i, '');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${base} - Review Report.docx`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
