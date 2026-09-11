# Remaker.work — สรุปสิ่งที่แก้ไปในรอบ Modernize (11 ก.ย. 2026)

โปรเจกต์นี้ตอนนี้อยู่ภายใต้ git แล้ว (commit `2043889` = baseline ก่อนแก้, `ce2814d` = การแก้ไขรอบนี้) ย้อนดู diff ได้ด้วย `git show ce2814d` หรือ `git diff 2043889 ce2814d`

## สิ่งที่แก้ไปแล้ว

**Flow สั่งงานจริงครบวงจรแล้ว** — เพิ่มหน้า `/login`, `/register`, `/dashboard` ให้ลูกค้า และหน้า `/upload` มีปุ่ม "ยืนยันสั่งพิมพ์" ที่อัปโหลดไฟล์จริงเข้า `POST /api/projects` แล้วยืนยันด้วย `PUT /api/projects/:id/checkout` (ยังต้อง login ก่อน — ดูราคาแบบไม่ login ได้เหมือนเดิม เป็นจุดขายของหน้าแรก) `lib/api.ts` เพิ่มฟังก์ชัน `createProject`, `checkout`, `myProjects`, `cancelProject` ให้ครบ

**สูตรประเมินเวลาพิมพ์ปรับใหม่** — `estimatePrintTime()` ตอนนี้คิดจาก infill และ layerHeight ด้วย ไม่ใช่แค่ขนาดไฟล์เฉยๆ (เพิ่ม selector เลือก layer height ในหน้า `/upload` ด้วย ไม่งั้นค่าที่เพิ่มเข้าไปจะไม่ถูกใช้จริง) ยังเป็น heuristic ไม่ใช่ slicer จริงตามที่คุยกันไว้ — นี่คือ "ปรับสูตรให้ดีขึ้น" ตามที่ตกลงไว้รอบนี้ ไม่ใช่การเปลี่ยนไปใช้ slicer จริง

**แก้บั๊ก `required()`** — ตอนนี้ถ้ารันด้วย `NODE_ENV=production` แล้ว `JWT_SECRET` หรือ `ADMIN_PASSWORD` ยังเป็นค่า default หรือไม่ได้ตั้งเลย แอปจะ**ไม่ยอมสตาร์ท**ทันที (fail fast) แทนที่จะรันต่อแบบเงียบๆด้วยค่าที่ไม่ปลอดภัย

**ตัด `estimatedPrintTime` ออกจาก public `/api/quote`** — ป้องกันไม่ให้ client ปลอมค่าเวลาพิมพ์เพื่อปลอมราคาได้

**ไฟล์ที่ถูกลบไม่ค้างอยู่บนดิสก์แล้ว** — เวลา admin hard-delete โปรเจกต์ ระบบจะลบไฟล์ที่อัปโหลดออกจากดิสก์ด้วย (สำคัญเพราะพื้นที่บน Pi จำกัด)

**เพิ่ม rate limiting + security headers แบบไม่พึ่ง npm package ใหม่** — org ของคุณบล็อก npm registry ไว้ (ทั้งใน sandbox นี้และ VM ที่เชื่อมกับ Mac) ทำให้ลง `express-rate-limit`/`helmet` ไม่ได้ เลยเขียนเองเป็นไฟล์เล็กๆ (`middleware/security.ts`) แทน — ข้อดีคือ dependency น้อยลง เหมาะกับการรันบน Pi ที่ RAM จำกัดด้วย

**ทำความสะอาดเอกสาร** — ลบ `apps/backend/dist` ที่ค้างไฟล์ queue.js เก่า, แก้ `QUICK-START.md`/`README.md` ที่ยังพูดถึงฟีเจอร์ Queue ที่ถูกถอดไปแล้ว, เพิ่มคำเตือนใน `env-backend-template.md` ว่าเป็นแค่ reference ล่วงหน้า ไม่ใช่สิ่งที่ทำงานจริงตอนนี้ทั้งหมด

## การตรวจสอบที่ทำได้ในรอบนี้

- Backend: `tsc --noEmit` และ `tsc -p` build ผ่านสะอาด ไม่มี type error
- Frontend: `tsc --noEmit` ทั้งโปรเจกต์ app router ผ่านสะอาด
- ทดสอบสูตร `estimatePrintTime()` ด้วยตัวเลขจริงหลายกรณี (infill สูง/ต่ำ, layer หนา/บาง) ได้ผลลัพธ์ตรงตามที่ตั้งใจ

**ข้อจำกัดของการตรวจสอบ:** รัน `next build` เต็มรูปแบบ หรือสตาร์ท backend จริงใน sandbox นี้ไม่ได้ เพราะ `node_modules` ที่ mount มาถูกติดตั้งบน macOS (darwin) แต่ VM ที่ใช้รันคำสั่งเป็น linux-arm64 ทำให้ native binary (esbuild, Prisma engine, Next SWC) ใช้ไม่ได้ และ registry ที่จะโหลดตัวที่ถูกต้องก็ถูกบล็อกด้วย **แนะนำให้รัน `npm run dev:all` หรือ `npm run build` บนเครื่อง Mac ของคุณเองอีกครั้งก่อน deploy จริงขึ้น Pi** เพื่อเช็ครอบสุดท้าย (บน Mac จริงจะไม่เจอปัญหานี้เพราะ platform ตรงกัน)

## สิ่งที่ยังไม่ได้แก้รอบนี้ (ตามที่ตกลงไว้ว่าจะเก็บไว้ก่อน)

- **Payment gateway** — ยังใช้ manual invoice / admin จัดการเองตามเดิม ตามที่เลือกไว้
- **JWT ยังเก็บใน localStorage** ไม่ได้ย้ายไป httpOnly cookie — การย้ายจะเปิดช่องโหว่ CSRF ใหม่สำหรับ endpoint อัปโหลดไฟล์ (multipart form ไม่ผ่าน CORS preflight) ถ้าจะทำต้องทำคู่กับ CSRF protection ด้วย ถือว่าเป็นงานคนละก้อนเลยขอเก็บไว้เป็นรายการแยกในอนาคตแทนที่จะทำครึ่งๆกลางๆรอบนี้
- **การประเมินราคาแบบ geometry/slicer จริง** — ยังเป็น heuristic ปรับปรุงแล้ว ไม่ใช่คำนวณจาก mesh จริงหรือรัน slicer ตามที่คุยกันไว้ตอนต้น (เป็นงานที่ใหญ่กว่ารอบนี้มาก)
- `npm audit` เรื่อง `next@14.2.15`/`multer@1.x` — ยังไม่ได้ upgrade เพราะ sandbox นี้ลง package ใหม่ไม่ได้เลย (registry ถูกบล็อก) ต้องทำบนเครื่องที่มี internet ปกติ

## แนะนำขั้นถัดไป

1. Clone/pull โค้ดนี้ไปรันบนเครื่อง Mac จริง (หรือ Pi) ที่มี internet ปกติ แล้ว `npm run build` ทั้งสอง workspace เพื่อยืนยันรอบสุดท้าย
2. ทดสอบ flow เต็มๆ ด้วยมือ: สมัครสมาชิก → อัปโหลดไฟล์ → ดูราคา → ยืนยันสั่งพิมพ์ → เช็คใน `/dashboard` และ admin panel
3. เปลี่ยน `JWT_SECRET`/`ADMIN_PASSWORD` ใน `.env` จริงก่อน deploy (ตอนนี้ระบบจะเตือน/ไม่ยอมสตาร์ทให้เองถ้าลืมตอน production)
4. เมื่อพร้อม ค่อยกลับมาคุยเรื่อง pricing engine แบบ geometry/slicer จริงตามที่คุยกันไว้ตอนต้น
