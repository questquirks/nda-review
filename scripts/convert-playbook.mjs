// แปลง data/NDA_Playbook_Mutual.xlsx (ชีต Playbook) เป็น lib/playbook.json
import XLSX from 'xlsx';
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'data/NDA_Playbook_Mutual.xlsx';
const COLS = {
  'id': 'id', 'Clause': 'clause', 'posture': 'posture', 'What to check': 'check',
  'Preferred': 'preferred', 'Fallback': 'fallback', 'Red flag': 'red_flag',
  'Sample language': 'sample_language', 'Rationale (EN)': 'rationale',
};
const POSTURES = ['discloser', 'recipient', 'balanced', 'all'];

const wb = XLSX.read(readFileSync(FILE));
const sheet = wb.Sheets['Playbook'];
if (!sheet) throw new Error('ไม่พบชีตชื่อ "Playbook"');
const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });

const rows = raw
  .filter(r => String(r['id']).trim())
  .map((r, i) => {
    const row = {};
    for (const [h, key] of Object.entries(COLS)) {
      if (!(h in r)) throw new Error(`ไม่พบคอลัมน์ "${h}" (ห้ามแก้ชื่อหัวคอลัมน์)`);
      row[key] = String(r[h]).trim();
    }
    if (!POSTURES.includes(row.posture)) throw new Error(`แถว ${i + 2}: posture "${row.posture}" ไม่ถูกต้อง`);
    return row;
  });

for (const p of ['discloser', 'recipient', 'balanced']) {
  const ids = rows.filter(r => r.posture === p || r.posture === 'all').map(r => r.id);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) throw new Error(`posture ${p}: id ซ้ำ ${[...new Set(dup)].join(', ')}`);
}

writeFileSync('lib/playbook.json', JSON.stringify(rows, null, 2));
console.log(`บันทึก lib/playbook.json แล้ว (${rows.length} แถว)`);
