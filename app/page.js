'use client';
import { useState } from 'react';
import { wordDiff, diffToHtml } from '@/lib/diff';

const POSTURES = [
  { id: 'discloser', title: 'เราเปิดเผยข้อมูลเป็นหลัก', desc: 'คุ้มครองข้อมูลของเราให้เข้มที่สุด' },
  { id: 'recipient', title: 'เรารับข้อมูลเป็นหลัก', desc: 'ภาระต้องปฏิบัติได้จริงและไม่หนักเกินไป' },
  { id: 'balanced', title: 'เปิดเผยและรับพอๆ กัน', desc: 'ใช้มาตรฐานตลาด สมดุลทั้งสองฝ่าย' },
];
const STATUS = {
  red_flag: 'ต้องแก้', missing: 'ไม่มีในสัญญา', fallback: 'รับได้ (แก้เพิ่มได้)', pass: 'ผ่าน',
};
const ORDER = ['red_flag', 'missing', 'fallback', 'pass'];
const STAGES = [
  { key: 'extract', label: 'อ่านไฟล์สัญญา' },
  { key: 'review', label: 'รีวิวตาม playbook' },
  { key: 'verify', label: 'ตรวจซ้ำและแก้ไข' },
];
const STAGE_TEXT = { idle: 'รอ', running: 'กำลังทำ…', done: 'เสร็จ', error: 'ไม่สำเร็จ' };

async function post(url, body, isForm = false) {
  const res = await fetch(url, isForm
    ? { method: 'POST', body }
    : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  let data;
  try { data = await res.json(); } catch { throw new Error(`เซิร์ฟเวอร์ตอบกลับผิดพลาด (${res.status}) อาจใช้เวลานานเกินกำหนด`); }
  if (!res.ok) throw new Error(data.error || `เกิดข้อผิดพลาด (${res.status})`);
  return data;
}

export default function Home() {
  const [step, setStep] = useState('posture');
  const [posture, setPosture] = useState(null);
  const [lang, setLang] = useState('th');
  const [file, setFile] = useState(null);
  const [stages, setStages] = useState({});
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [decisions, setDecisions] = useState({});
  const [edits, setEdits] = useState({});
  const [editing, setEditing] = useState(null);
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState('');

  function pickFile(f) {
    if (!f) return;
    if (!/\.(docx?|DOCX?)$/.test(f.name)) {
      setFileError('รองรับเฉพาะไฟล์ Word (.docx หรือ .doc)');
      return;
    }
    setFileError(''); setFile(f);
  }

  const mark = (key, val) => setStages(s => ({ ...s, [key]: val }));
  const postureInfo = POSTURES.find(p => p.id === posture);

  async function run() {
    setStep('working'); setError(''); setStages({});
    let current = 'extract';
    try {
      mark('extract', 'running');
      const fd = new FormData(); fd.append('file', file);
      const { text } = await post('/api/extract', fd, true);
      mark('extract', 'done');

      current = 'review'; mark('review', 'running');
      const review = await post('/api/review', { posture, lang, contractText: text });
      mark('review', 'done');

      current = 'verify'; mark('verify', 'running');
      const verified = await post('/api/verify', { posture, lang, contractText: text, review });
      mark('verify', 'done');

      setResult({ ...verified, fileName: file.name, posture });
      setDecisions({}); setEdits({}); setEditing(null);
      setStep('results');
    } catch (e) {
      mark(current, 'error');
      setError(e.message);
    }
  }

  function reset() {
    setStep('posture'); setFile(null); setFileError(''); setResult(null); setError(''); setStages({});
  }

  const items = result ? [...result.items].sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status)) : [];
  const toFix = items.filter(i => i.status !== 'pass');
  const revisedOf = it => edits[it.id] ?? it.revised;

  async function copyAccepted() {
    const chosen = toFix.filter(i => decisions[i.id] === 'accepted');
    const html = chosen.map(it => {
      const ref = it.contract_ref ? ` (Clause ${it.contract_ref})` : ' (new clause)';
      const body = diffToHtml(wordDiff(it.original, revisedOf(it)));
      const comment = it.comment_en ? `<p><i>Comment: ${it.comment_en}</i></p>` : '';
      return `<p><b>${it.clause}${ref}</b></p><p>${body}</p>${comment}`;
    }).join('<br>');
    const plain = chosen.map(it => `${it.clause} ${it.contract_ref ? `(Clause ${it.contract_ref})` : '(new clause)'}\n${revisedOf(it)}\n${it.comment_en ? `Comment: ${it.comment_en}` : ''}`).join('\n\n');
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      })]);
    } catch {
      await navigator.clipboard.writeText(plain);
    }
    setCopied(true); setTimeout(() => setCopied(false), 2500);
  }

  const stepIndex = { posture: 0, upload: 1, working: 2, results: 3 }[step];
  const stepNames = ['เลือกฝั่ง', 'อัปโหลดสัญญา', 'รีวิวและตรวจซ้ำ', 'ผลลัพธ์'];

  return (
    <main>
      <h1>NDA Review</h1>
      <p className="muted">รีวิว Mutual NDA ตาม playbook ผลลัพธ์เป็นร่างให้ทนายตรวจก่อนใช้เสมอ</p>

      <ol className="steps" aria-label="ขั้นตอน">
        {stepNames.map((n, i) => (
          <li key={n} className={i === stepIndex ? 'on' : i < stepIndex ? 'done' : ''}>{i + 1}. {n}</li>
        ))}
      </ol>

      {step === 'posture' && (
        <section className="panel">
          <h2>ในสัญญานี้ เราอยู่ฝั่งไหน</h2>
          <div className="choices">
            {POSTURES.map(p => (
              <button key={p.id} className="choice" aria-pressed={posture === p.id} onClick={() => setPosture(p.id)}>
                <strong>{p.title}</strong><span>{p.desc}</span>
              </button>
            ))}
          </div>
          <div className="row" style={{ marginBottom: 20 }}>
            <span className="muted">คำอธิบายภายในเป็นภาษา</span>
            <div className="seg">
              <button aria-pressed={lang === 'th'} onClick={() => setLang('th')}>ไทย</button>
              <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>English</button>
            </div>
          </div>
          <button className="btn" disabled={!posture} onClick={() => setStep('upload')}>ถัดไป: อัปโหลดสัญญา</button>
        </section>
      )}

      {step === 'upload' && (
        <section className="panel">
          <h2>อัปโหลด NDA</h2>
          <p>ฝั่งที่เลือก: <strong>{postureInfo.title}</strong> <button className="link" onClick={() => setStep('posture')}>เปลี่ยน</button></p>
          <label
            className={`drop ${dragging ? 'over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files?.[0]); }}
          >
            <input type="file" accept=".docx,.doc" onChange={e => pickFile(e.target.files?.[0])} />
            {file
              ? <><strong>{file.name}</strong><br /><span className="muted">ลากไฟล์อื่นมาวาง หรือคลิกเพื่อเปลี่ยน</span></>
              : <>ลากไฟล์ Word มาวางที่นี่<br /><span className="muted">หรือคลิกเพื่อเลือกไฟล์ (.docx หรือ .doc)</span></>}
          </label>
          {fileError && <div className="error">{fileError}</div>}
          <button className="btn" disabled={!file} onClick={run}>เริ่มรีวิว</button>
        </section>
      )}

      {step === 'working' && (
        <section className="panel">
          <h2>กำลังรีวิว {file?.name}</h2>
          {error && <div className="error">{error}</div>}
          <ul className="progress">
            {STAGES.map(s => (
              <li key={s.key}><span>{s.label}</span><span className="muted">{STAGE_TEXT[stages[s.key] || 'idle']}</span></li>
            ))}
          </ul>
          <p className="muted" style={{ marginTop: 12 }}>ใช้เวลาประมาณ 1–3 นาที</p>
          {error && (
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn" onClick={run}>ลองใหม่</button>
              <button className="btn ghost" onClick={() => setStep('upload')}>กลับไปเลือกไฟล์</button>
            </div>
          )}
        </section>
      )}

      {step === 'results' && result && (
        <>
          <section className="panel">
            <h2>{result.fileName}</h2>
            <p>ฝั่ง: <strong>{POSTURES.find(p => p.id === result.posture).title}</strong></p>
            <div className="summary">
              {ORDER.map(s => (
                <span key={s} className={`pill s-${s}`}>{STATUS[s]} {items.filter(i => i.status === s).length}</span>
              ))}
            </div>
            <p className="muted">ตรวจซ้ำแล้ว: แก้ไข {items.filter(i => i.check === 'corrected').length} ข้อจากรอบแรก</p>
          </section>

          <div className="toolbar row">
            <button className="btn small ghost" onClick={() => setDecisions(Object.fromEntries(toFix.map(i => [i.id, 'accepted'])))}>รับทั้งหมด</button>
            <button className="btn small" disabled={!toFix.some(i => decisions[i.id] === 'accepted')} onClick={copyAccepted}>
              {copied ? 'คัดลอกแล้ว' : 'คัดลอก redline ที่รับ'}
            </button>
            <button className="btn small ghost" onClick={reset}>รีวิวสัญญาใหม่</button>
          </div>

          {items.map(it => {
            const revised = revisedOf(it);
            const parts = wordDiff(it.original, revised);
            const changed = parts.some(p => p.type !== 'same');
            const d = decisions[it.id];
            return (
              <article key={it.id} className={`item ${d === 'rejected' ? 'rejected' : ''}`}>
                <div className="item-head">
                  <h3>{it.clause}{it.contract_ref ? ` (ข้อ ${it.contract_ref})` : ''}</h3>
                  <span className={`pill s-${it.status}`}>{STATUS[it.status]}</span>
                </div>

                {editing === it.id ? (
                  <textarea value={revised} onChange={e => setEdits(x => ({ ...x, [it.id]: e.target.value }))} />
                ) : (
                  (it.original || revised) && (
                    <div className="clause">
                      {changed ? parts.map((p, k) =>
                        p.type === 'del' ? <s key={k}>{p.text}</s> : p.type === 'ins' ? <b key={k}>{p.text}</b> : <span key={k}>{p.text}</span>
                      ) : it.original}
                    </div>
                  )
                )}

                {it.quote_warning && <div className="warn">ไม่พบข้อความนี้ในสัญญาแบบตรงตัว กรุณาเทียบกับต้นฉบับเอง</div>}
                {it.note && <><div className="label">คำอธิบาย</div><p>{it.note}</p></>}
                {it.comment_en && <><div className="label">Comment to counterparty</div><p><i>{it.comment_en}</i></p></>}
                {it.check === 'corrected' && it.check_note && <div className="checked">ตรวจซ้ำแก้ไข: {it.check_note}</div>}

                {it.status !== 'pass' && (
                  <div className="actions">
                    <button className="btn small ghost" aria-pressed={d === 'accepted'} onClick={() => setDecisions(x => ({ ...x, [it.id]: 'accepted' }))}>รับ</button>
                    <button className="btn small ghost" aria-pressed={d === 'rejected'} onClick={() => setDecisions(x => ({ ...x, [it.id]: 'rejected' }))}>ไม่รับ</button>
                    <button className="btn small ghost" onClick={() => setEditing(editing === it.id ? null : it.id)}>
                      {editing === it.id ? 'เสร็จ' : 'แก้ข้อความ'}
                    </button>
                  </div>
                )}
              </article>
            );
          })}

          {result.uncovered?.length > 0 && (
            <section className="panel">
              <h2>ข้ออื่นที่ playbook ไม่ครอบคลุม</h2>
              {result.uncovered.map((u, k) => (
                <p key={k}><strong>{u.contract_ref ? `ข้อ ${u.contract_ref}` : 'ทั่วไป'}:</strong> {u.issue}</p>
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}
