import mammoth from 'mammoth';
import WordExtractor from 'word-extractor';

export const runtime = 'nodejs';

// อ่านไฟล์ Word ทั้งแบบใหม่ (.docx) และแบบเก่า (.doc) เป็นข้อความ
export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!file || typeof file === 'string') {
      return Response.json({ error: 'ไม่พบไฟล์ กรุณาเลือกไฟล์ NDA' }, { status: 400 });
    }
    const name = file.name.toLowerCase();
    if (!name.endsWith('.docx') && !name.endsWith('.doc')) {
      return Response.json({ error: 'รองรับเฉพาะไฟล์ Word (.docx หรือ .doc) หากเป็น PDF ให้แปลงเป็น Word ก่อน' }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());

    let raw;
    if (name.endsWith('.docx')) {
      raw = (await mammoth.extractRawText({ buffer })).value;
    } else {
      const doc = await new WordExtractor().extract(buffer);
      raw = doc.getBody();
    }

    const text = raw.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
    if (text.length < 300) {
      return Response.json({ error: 'อ่านข้อความจากไฟล์ได้น้อยเกินไป ไฟล์อาจเป็นภาพสแกน' }, { status: 400 });
    }
    return Response.json({ text });
  } catch (e) {
    return Response.json({ error: `อ่านไฟล์ไม่สำเร็จ: ${e.message}` }, { status: 500 });
  }
}
