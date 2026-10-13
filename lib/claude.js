import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic(); // อ่าน ANTHROPIC_API_KEY จาก environment
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5-5';

// เรียก Claude แบบ streaming และให้ตอบผ่าน tool เพื่อให้ได้ JSON ตามโครงที่กำหนด
// ลดการ "คิด" ก่อนตอบ เพื่อไม่ให้ใช้ token เกินกำหนด
export async function callTool({ system, user, tool }) {
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 64000,
    thinking: { type: 'between_tools' },
    output_config: { effort: 'medium' },
    system: `${system}\n\nRespond only by calling the ${tool.name} tool exactly once. Do not write any other text. Keep "original" excerpts short (the sentence containing the issue) and keep notes to 1-2 sentences.`,
    tools: [tool],
    messages: [{ role: 'user', content: user }],
  });
  const res = await stream.finalMessage();
  if (res.stop_reason === 'max_tokens') {
    throw new Error('ผลลัพธ์ยาวเกินกำหนด กรุณาลองใหม่ หรือเพิ่ม max_tokens ใน lib/claude.js');
  }
  const block = res.content.find(b => b.type === 'tool_use');
  if (!block) throw new Error('AI ไม่ได้ส่งผลลัพธ์ตามรูปแบบที่กำหนด กรุณาลองใหม่');
  return block.input;
}