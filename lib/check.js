// การตรวจด้วยโค้ด (ไม่ใช้ AI): ข้อความที่ยกมาต้องมีอยู่ในสัญญาจริง และต้องครบทุกข้อใน playbook
const norm = s => (s || '')
  .replace(/[\u2018\u2019]/g, "'")
  .replace(/[\u201C\u201D]/g, '"')
  .replace(/[\u2013\u2014]/g, '-')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase();

export function quoteFound(contract, quote) {
  if (!quote) return true;
  return norm(contract).includes(norm(quote));
}

export function codeChecks(contract, items, playbook) {
  const flags = [];
  for (const it of items) {
    if (it.status !== 'missing' && !quoteFound(contract, it.original)) {
      flags.push(`${it.id}: the "original" text is not found verbatim in the contract.`);
    }
    if (it.status === 'missing' && !it.revised) {
      flags.push(`${it.id}: status is "missing" but no new clause text is proposed.`);
    }
  }
  const got = new Set(items.map(i => i.id));
  for (const p of playbook) {
    if (!got.has(p.id)) flags.push(`${p.id}: playbook item not reviewed.`);
  }
  return flags;
}
