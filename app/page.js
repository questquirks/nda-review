'use client';
import { useState, useEffect } from 'react';
import { wordDiff, diffToHtml } from '@/lib/diff';

// ข้อความหน้าเว็บทั้งหมด แยกภาษาไทย/อังกฤษ แก้ข้อความได้ที่นี่ที่เดียว
const T = {
  th: {
    subtitle: 'การรีวิว NDA เป็นไปตาม "หลักการพื้นฐานของสัญญาเท่านั้น" ผลลัพธ์เป็นเพียงร่าง และจำเป็นต้องให้ฝ่ายกฎหมายตรวจก่อนใช้งานเสมอ',
    steps: ['เลือกฝั่ง', 'อัปโหลดสัญญา', 'รีวิวและตรวจซ้ำ', 'ผลลัพธ์'],
    stepsLabel: 'ขั้นตอน',
    postures: {
      discloser: { title: 'เราเปิดเผยข้อมูลเป็นหลัก', desc: 'ปกป้องข้อมูลของเราให้เหมาะสม' },
      recipient: { title: 'เรารับข้อมูลเป็นหลัก', desc: 'ภาระต้องปฏิบัติได้จริงและไม่หนักเกินไป' },
      balanced: { title: 'เปิดเผยและรับพอๆ กัน', desc: 'ใช้มาตรฐานตลาด สมดุลทั้งสองฝ่าย' },
    },
    whichSide: 'ในสัญญานี้ เราอยู่ฝั่งไหน',
    noteLang: 'คำอธิบายภายในเป็นภาษา',
    next: 'ถัดไป: อัปโหลดสัญญา',
    uploadTitle: 'อัปโหลด NDA',
    chosenSide: 'ฝั่งที่เลือก:',
    change: 'เปลี่ยน',
    dropHere: 'ลากไฟล์ Word มาวางที่นี่',
    orClick: 'หรือคลิกเพื่อเลือกไฟล์ (.docx หรือ .doc)',
    dropAnother: 'ลากไฟล์อื่นมาวาง หรือคลิกเพื่อเปลี่ยน',
    wordOnly: 'รองรับเฉพาะไฟล์ Word (.docx หรือ .doc)',
    start: 'เริ่มรีวิว',
    reviewing: 'กำลังรีวิว',
    stages: { extract: 'อ่านไฟล์สัญญา', review: 'รีวิวตาม guideline', verify: 'ตรวจซ้ำและแก้ไข' },
    stageText: { idle: 'รอ', running: 'กำลังทำ…', done: 'เสร็จ', error: 'ไม่สำเร็จ' },
    eta: 'ใช้เวลาประมาณ 2–4 นาที',
    retry: 'ลองใหม่',
    backToFile: 'กลับไปเลือกไฟล์',
    side: 'ฝั่ง:',
    status: { red_flag: 'ต้องแก้', missing: 'ไม่มีในสัญญา', fallback: 'รับได้ (แก้เพิ่มได้)', pass: 'ผ่าน' },
    corrected: n => `ตรวจซ้ำแล้ว: แก้ไข ${n} ข้อจากรอบแรก`,
    acceptAll: 'รับทั้งหมด',
    copy: 'คัดลอก redline ที่รับ',
    copied: 'คัดลอกแล้ว',
    newReview: 'รีวิวสัญญาใหม่',
    clause: 'ข้อ',
    quoteWarn: 'ไม่พบข้อความนี้ในสัญญาแบบตรงตัว กรุณาเทียบกับต้นฉบับเอง',
    explanation: 'คำอธิบาย',
    checkFixed: 'ตรวจซ้ำแก้ไข:',
    accept: 'รับ',
    reject: 'ไม่รับ',
    edit: 'แก้ข้อความ',
    doneEdit: 'เสร็จ',
    uncovered: 'ข้ออื่นที่ guideline ไม่ครอบคลุม',
    general: 'ทั่วไป',
    serverErr: s => `เซิร์ฟเวอร์ตอบกลับผิดพลาด (${s}) อาจใช้เวลานานเกินกำหนด`,
    genericErr: s => `เกิดข้อผิดพลาด (${s})`,
  },
  en: {
    subtitle: 'Reviews NDAs against basic contract principles only. The output is a draft and must always be reviewed by the legal team before use.',
    steps: ['Choose side', 'Upload contract', 'Review & verify', 'Results'],
    stepsLabel: 'Steps',
    postures: {
      discloser: { title: 'We mainly disclose', desc: 'Strongest protection for our information' },
      recipient: { title: 'We mainly receive', desc: 'Workable, proportionate obligations' },
      balanced: { title: 'Both disclose equally', desc: 'Market-standard, balanced terms' },
    },
    whichSide: 'Which side are we on in this NDA?',
    noteLang: 'Internal notes language',
    next: 'Next: upload contract',
    uploadTitle: 'Upload NDA',
    chosenSide: 'Selected side:',
    change: 'Change',
    dropHere: 'Drag and drop a Word file here',
    orClick: 'or click to choose a file (.docx or .doc)',
    dropAnother: 'Drop another file or click to change',
    wordOnly: 'Only Word files (.docx or .doc) are supported',
    start: 'Start review',
    reviewing: 'Reviewing',
    stages: { extract: 'Reading contract', review: 'Reviewing against guideline', verify: 'Verifying and correcting' },
    stageText: { idle: 'Waiting', running: 'In progress…', done: 'Done', error: 'Failed' },
    eta: 'Takes about 2–4 minutes',
    retry: 'Try again',
    backToFile: 'Back to file selection',
    side: 'Side:',
    status: { red_flag: 'Must fix', missing: 'Missing', fallback: 'Acceptable (optional edit)', pass: 'Pass' },
    corrected: n => `Verified: ${n} item(s) corrected from the first pass`,
    acceptAll: 'Accept all',
    copy: 'Copy accepted redlines',
    copied: 'Copied',
    newReview: 'Review another NDA',
    clause: 'Clause',
    quoteWarn: 'This text was not found verbatim in the contract. Please check against the original.',
    explanation: 'Explanation',
    checkFixed: 'Corrected on verification:',
    accept: 'Accept',
    reject: 'Reject',
    edit: 'Edit text',
    doneEdit: 'Done',
    uncovered: 'Other clauses not covered by the guideline',
    general: 'General',
    serverErr: s => `Server error (${s}). The request may have timed out.`,
    genericErr: s => `Something went wrong (${s})`,
  },
};

const POSTURE_IDS = ['discloser', 'recipient', 'balanced'];
const ORDER = ['red_flag', 'missing', 'fallback', 'pass'];
const STAGE_KEYS = ['extract', 'review', 'verify'];

export default function Home() {
  const [ui, setUi] = useState('th');
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

  const t = T[ui];

  // จำภาษาหน้าเว็บที่เลือกไว้ในเบราว์เซอร์
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ui-lang');
      if (saved === 'th' || saved === 'en') { setUi(saved); setLang(saved); }
    } catch {}
  }, []);

  function switchUi(l) {
    setUi(l); setLang(l);
    try { localStorage.setItem('ui-lang', l); } catch {}
    document.documentElement.lang = l;
  }

  async function post(url, body, isForm = false) {
    const res = await fetch(url, isForm
      ? { method: 'POST', body }
      : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    let data;
    try { data = await res.json(); } catch { throw new Error(t.serverErr(res.status)); }
    if (!res.ok) throw new Error(data.error || t.genericErr(res.status));
    return data;
  }

  function pickFile(f) {
    if (!f) return;
    if (!/\.docx?$/i.test(f.name)) { setFileError('wordOnly'); return; }
    setFileError(''); setFile(f);
  }

  const mark = (key, val) => setStages(s => ({ ...s, [key]: val }));

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

  return (
    <main>
      <div className="top">
        <h1>NDA Review</h1>
        <div className="seg" role="group" aria-label="Language">
          <button aria-pressed={ui === 'th'} onClick={() => switchUi('th')}>ไทย</button>
          <button aria-pressed={ui === 'en'} onClick={() => switchUi('en')}>EN</button>
        </div>
      </div>
      <p className="muted">{t.subtitle}</p>

      <ol className="steps" aria-label={t.stepsLabel}>
        {t.steps.map((n, i) => (
          <li key={i} className={i === stepIndex ? 'on' : i < stepIndex ? 'done' : ''}>{i + 1}. {n}</li>
        ))}
      </ol>

      {step === 'posture' && (
        <section className="panel">
          <h2>{t.whichSide}</h2>
          <div className="choices">
            {POSTURE_IDS.map(id => (
              <button key={id} className="choice" aria-pressed={posture === id} onClick={() => setPosture(id)}>
                <strong>{t.postures[id].title}</strong><span>{t.postures[id].desc}</span>
              </button>
            ))}
          </div>
          <div className="row" style={{ marginBottom: 20 }}>
            <span className="muted">{t.noteLang}</span>
            <div className="seg">
              <button aria-pressed={lang === 'th'} onClick={() => setLang('th')}>ไทย</button>
              <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>English</button>
            </div>
          </div>
          <button className="btn" disabled={!posture} onClick={() => setStep('upload')}>{t.next}</button>
        </section>
      )}

      {step === 'upload' && (
        <section className="panel">
          <h2>{t.uploadTitle}</h2>
          <p>{t.chosenSide} <strong>{t.postures[posture].title}</strong> <button className="link" onClick={() => setStep('posture')}>{t.change}</button></p>
          <label
            className={`drop ${dragging ? 'over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files?.[0]); }}
          >
            <input type="file" accept=".docx,.doc" onChange={e => pickFile(e.target.files?.[0])} />
            {file
              ? <><strong>{file.name}</strong><br /><span className="muted">{t.dropAnother}</span></>
              : <>{t.dropHere}<br /><span className="muted">{t.orClick}</span></>}
          </label>
          {fileError && <div className="error">{t[fileError]}</div>}
          <button className="btn" disabled={!file} onClick={run}>{t.start}</button>
        </section>
      )}

      {step === 'working' && (
        <section className="panel">
          <h2>{t.reviewing} {file?.name}</h2>
          {error && <div className="error">{error}</div>}
          <ul className="progress">
            {STAGE_KEYS.map(k => (
              <li key={k}><span>{t.stages[k]}</span><span className="muted">{t.stageText[stages[k] || 'idle']}</span></li>
            ))}
          </ul>
          <p className="muted" style={{ marginTop: 12 }}>{t.eta}</p>
          {error && (
            <div className="row" style={{ marginTop: 12 }}>
              <button className="btn" onClick={run}>{t.retry}</button>
              <button className="btn ghost" onClick={() => setStep('upload')}>{t.backToFile}</button>
            </div>
          )}
        </section>
      )}

      {step === 'results' && result && (
        <>
          <section className="panel">
            <h2>{result.fileName}</h2>
            <p>{t.side} <strong>{t.postures[result.posture].title}</strong></p>
            <div className="summary">
              {ORDER.map(s => (
                <span key={s} className={`pill s-${s}`}>{t.status[s]} {items.filter(i => i.status === s).length}</span>
              ))}
            </div>
            <p className="muted">{t.corrected(items.filter(i => i.check === 'corrected').length)}</p>
          </section>

          <div className="toolbar row">
            <button className="btn small ghost" onClick={() => setDecisions(Object.fromEntries(toFix.map(i => [i.id, 'accepted'])))}>{t.acceptAll}</button>
            <button className="btn small" disabled={!toFix.some(i => decisions[i.id] === 'accepted')} onClick={copyAccepted}>
              {copied ? t.copied : t.copy}
            </button>
            <button className="btn small ghost" onClick={reset}>{t.newReview}</button>
          </div>

          {items.map(it => {
            const revised = revisedOf(it);
            const parts = wordDiff(it.original, revised);
            const changed = parts.some(p => p.type !== 'same');
            const d = decisions[it.id];
            return (
              <article key={it.id} className={`item ${d === 'rejected' ? 'rejected' : ''}`}>
                <div className="item-head">
                  <h3>{it.clause}{it.contract_ref ? ` (${t.clause} ${it.contract_ref})` : ''}</h3>
                  <span className={`pill s-${it.status}`}>{t.status[it.status]}</span>
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

                {it.quote_warning && <div className="warn">{t.quoteWarn}</div>}
                {it.note && <><div className="label">{t.explanation}</div><p>{it.note}</p></>}
                {it.comment_en && <><div className="label">Comment to counterparty</div><p><i>{it.comment_en}</i></p></>}
                {it.check === 'corrected' && it.check_note && <div className="checked">{t.checkFixed} {it.check_note}</div>}

                {it.status !== 'pass' && (
                  <div className="actions">
                    <button className="btn small ghost" aria-pressed={d === 'accepted'} onClick={() => setDecisions(x => ({ ...x, [it.id]: 'accepted' }))}>{t.accept}</button>
                    <button className="btn small ghost" aria-pressed={d === 'rejected'} onClick={() => setDecisions(x => ({ ...x, [it.id]: 'rejected' }))}>{t.reject}</button>
                    <button className="btn small ghost" onClick={() => setEditing(editing === it.id ? null : it.id)}>
                      {editing === it.id ? t.doneEdit : t.edit}
                    </button>
                  </div>
                )}
              </article>
            );
          })}

          {result.uncovered?.length > 0 && (
            <section className="panel">
              <h2>{t.uncovered}</h2>
              {result.uncovered.map((u, k) => (
                <p key={k}><strong>{u.contract_ref ? `${t.clause} ${u.contract_ref}` : t.general}:</strong> {u.issue}</p>
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}
