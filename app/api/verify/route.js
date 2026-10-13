import { callTool } from '@/lib/claude';
import { buildVerify } from '@/lib/prompts';
import { playbookFor, POSTURES } from '@/lib/playbook';
import { codeChecks, quoteFound } from '@/lib/check';

export const runtime = 'nodejs';
export const maxDuration = 300;

// รอบที่ 2: โค้ดตรวจข้อความที่ยกมา + AI ตัวที่สองตรวจซ้ำและแก้ไข
export async function POST(req) {
  try {
    const { posture, lang = 'th', contractText, review } = await req.json();
    if (!POSTURES.includes(posture)) {
      return Response.json({ error: 'ยังไม่ได้เลือกฝั่ง' }, { status: 400 });
    }
    const playbook = playbookFor(posture);
    const flags = codeChecks(contractText, review.items || [], playbook);
    const verified = await callTool(buildVerify({ posture, lang, playbook, contractText, review, flags }));

    // ตรวจด้วยโค้ดอีกครั้งหลังแก้ ข้อไหนยังหาข้อความเดิมในสัญญาไม่เจอ จะติดป้ายเตือน
    const items = (verified.items || []).map(it => ({
      ...it,
      quote_warning: it.status !== 'missing' && !quoteFound(contractText, it.original),
    }));
    const order = playbook.map(p => p.id);
    items.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    return Response.json({ items, uncovered: verified.uncovered || [], first_pass_flags: flags });
  } catch (e) {
    return Response.json({ error: `ตรวจซ้ำไม่สำเร็จ: ${e.message}` }, { status: 500 });
  }
}
