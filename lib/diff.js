// เทียบข้อความระดับคำ เพื่อแสดงส่วนที่ลบ (ขีดฆ่า) และส่วนที่เพิ่ม (ตัวหนา)
export function wordDiff(a = '', b = '') {
  const A = a.split(/(\s+)/).filter(Boolean);
  const B = b.split(/(\s+)/).filter(Boolean);
  const n = A.length, m = B.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = [];
  const push = (type, text) => {
    const last = out[out.length - 1];
    if (last && last.type === type) last.text += text; else out.push({ type, text });
  };
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { push('same', A[i]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { push('del', A[i]); i++; }
    else { push('ins', B[j]); j++; }
  }
  while (i < n) push('del', A[i++]);
  while (j < m) push('ins', B[j++]);
  return tidy(out);
}

// รวมคำสั้นๆ ที่คั่นระหว่างจุดแก้ เพื่อให้ redline อ่านเป็นวลีเดียว ไม่สลับลบ-เพิ่มทีละคำ
function tidy(parts) {
  const absorbed = [];
  parts.forEach((p, k) => {
    const between = k > 0 && k < parts.length - 1 && parts[k - 1].type !== 'same' && parts[k + 1].type !== 'same';
    const words = p.text.trim().split(/\s+/).filter(Boolean).length;
    if (p.type === 'same' && between && words <= 2) absorbed.push({ type: 'del', text: p.text }, { type: 'ins', text: p.text });
    else absorbed.push(p);
  });
  const out = [];
  let del = '', ins = '';
  const flush = () => { if (del) out.push({ type: 'del', text: del }); if (ins) out.push({ type: 'ins', text: ins }); del = ''; ins = ''; };
  for (const p of absorbed) {
    if (p.type === 'same') { flush(); out.push(p); }
    else if (p.type === 'del') del += p.text;
    else ins += p.text;
  }
  flush();
  return out;
}

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function diffToHtml(parts) {
  return parts.map(p =>
    p.type === 'del' ? `<s>${esc(p.text)}</s>` : p.type === 'ins' ? `<b>${esc(p.text)}</b>` : esc(p.text)
  ).join('');
}
