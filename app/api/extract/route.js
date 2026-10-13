import mammoth from 'mammoth';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
      return Response.json({ error: 'ไม่พบไฟล์ กรุณาเลือกไฟล์ NDA' }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith('.docx')) {
      return Response.json({ error: 'รองรับเฉพาะไฟล์ Word (.docx) หากเป็น PDF ให้แปลงเป็น Word ก่อน' }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const { value } = await mammoth.extractRawText({ buffer });
    const text = value.replace(/\n{3,}/g, '\n\n').trim();
    if (text.length < 300) {
      return Response.json({ error: 'อ่านข้อความจากไฟล์ได้น้อยเกินไป ไฟล์อาจเป็นภาพสแกน' }, { status: 400 });
    }
    return Response.json({ text });
  } catch (e) {
    return Response.json({ error: `อ่านไฟล์ไม่สำเร็จ: ${e.message}` }, { status: 500 });
  }
}
