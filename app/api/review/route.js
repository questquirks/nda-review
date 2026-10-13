import { callTool } from '@/lib/claude';
import { buildReview } from '@/lib/prompts';
import { playbookFor, POSTURES } from '@/lib/playbook';

export const runtime = 'nodejs';
export const maxDuration = 300;

// รอบที่ 1: AI รีวิวสัญญาเทียบกับ playbook ของฝั่งที่เลือก
export async function POST(req) {
  try {
    const { posture, lang = 'th', contractText } = await req.json();
    if (!POSTURES.includes(posture)) {
      return Response.json({ error: 'ยังไม่ได้เลือกฝั่ง' }, { status: 400 });
    }
    if (!contractText) return Response.json({ error: 'ไม่มีข้อความสัญญา' }, { status: 400 });
    const playbook = playbookFor(posture);
    const review = await callTool(buildReview({ posture, lang, playbook, contractText }));
    return Response.json(review);
  } catch (e) {
    return Response.json({ error: `รีวิวไม่สำเร็จ: ${e.message}` }, { status: 500 });
  }
}
