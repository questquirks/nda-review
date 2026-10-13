# NDA Review

เว็บรีวิว Mutual NDA ตาม playbook: เลือกฝั่ง → อัปโหลด .docx → AI รีวิว → ตรวจซ้ำ (โค้ด + AI ตัวที่สอง) → ทนายรับ/ไม่รับ/แก้รายข้อ → คัดลอก redline ไปวางใน Word

## โครงสร้างไฟล์

| ไฟล์ | หน้าที่ |
|---|---|
| `data/NDA_Playbook_Mutual.xlsx` | playbook ที่แก้ไขได้ |
| `lib/playbook.json` | playbook ที่ระบบใช้ (สร้างจาก Excel ด้วย `npm run playbook`) |
| `lib/prompts.js` | คำสั่งที่ส่งให้ AI ทั้งรอบรีวิวและรอบตรวจซ้ำ |
| `lib/check.js` | การตรวจด้วยโค้ด: ข้อความที่ยกมาต้องมีอยู่ในสัญญาจริง และครบทุกข้อ |
| `app/api/extract` | อ่านไฟล์ Word เป็นข้อความ |
| `app/api/review` | รอบที่ 1: AI รีวิว |
| `app/api/verify` | รอบที่ 2: ตรวจซ้ำและแก้ไข |
| `app/page.js` | หน้าจอทั้งหมด |
| `middleware.js` | ล็อกเว็บด้วยรหัสผ่าน |

## รันในเครื่อง

1. ติดตั้ง Node.js 20 ขึ้นไป
2. `npm install`
3. คัดลอก `.env.example` เป็น `.env.local` แล้วใส่ `ANTHROPIC_API_KEY` และ `ACCESS_PASSWORD`
4. `npm run dev` แล้วเปิด http://localhost:3000 (ช่อง username ใส่อะไรก็ได้ รหัสผ่านตาม `ACCESS_PASSWORD`)

## Deploy ขึ้น Vercel

1. สร้าง repo ใหม่บน GitHub (ตั้งเป็น Private) แล้ว push โฟลเดอร์นี้ขึ้นไป
2. Vercel → Add New → Project → เลือก repo นี้ → Deploy
3. Settings → Environment Variables ใส่ `ANTHROPIC_API_KEY` และ `ACCESS_PASSWORD` แล้ว Redeploy

ถ้า deploy แจ้งว่า `maxDuration` เกินขีดจำกัดของแพ็กเกจ ให้ลดค่าใน `app/api/review/route.js` และ `app/api/verify/route.js` ให้ตรงกับที่แพ็กเกจรองรับ

## แก้ไข playbook

1. แก้ `data/NDA_Playbook_Mutual.xlsx` (ห้ามแก้ชื่อชีต ชื่อหัวคอลัมน์ และห้าม merge cell)
2. `npm run playbook` (สคริปต์จะแจ้งถ้า posture พิมพ์ผิดหรือ id ซ้ำ)
3. commit และ push → Vercel deploy ให้อัตโนมัติ

## ข้อควรรู้

- รองรับเฉพาะ .docx เลขข้อที่ Word สร้างอัตโนมัติ (auto-numbering) อาจไม่ติดมากับข้อความ ทำให้อ้างเลขข้อคลาดได้
- ระบบไม่บันทึกไฟล์หรือผลรีวิว ปิดหน้าเว็บแล้วข้อมูลหาย
- ห้ามใช้กับสัญญาจริงของบริษัทจนกว่า IT/security อนุมัติการส่งข้อมูลไปยัง Anthropic API
- ผลลัพธ์เป็นร่าง ต้องให้ทนายตรวจทุกครั้ง
