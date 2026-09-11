# Remaker.work — สรุปสิ่งที่ควรแก้ไข

_รีวิวจากโค้ดจริงในโฟลเดอร์ `remaker_frontshop` วันที่ 11 ก.ย. 2026_

## ภาพรวม

โครงสร้างโปรเจกต์ (Next.js 14 + Express/TypeScript + Prisma/SQLite) วางไว้ดีและใกล้เคียง spec ใน `remaker-work-master-prompt.md` มาก — มีระบบ auth, admin panel, gallery, pricing engine, email log ครบตามโครงแล้ว แต่ยังมีช่องว่างสำคัญที่ควรแก้ก่อนเปิดใช้งานจริง โดยเฉพาะ **flow การสั่งงานจริงที่ยังไม่ครบวงจร** และ **ความแม่นยำของราคาที่ยังเป็น heuristic ง่ายๆ** ซึ่งตรงกับที่เราคุยกันไปก่อนหน้าเรื่องการประเมินราคาแบบ slicer จริง

---

## 1) ต้องแก้ก่อนเปิดใช้จริง (Critical)

**Flow สั่งงานจริงยังไม่ต่อกัน** — หน้า `/upload` เรียกแค่ `POST /api/quote` (พรีวิวราคาจากขนาดไฟล์ที่ browser คำนวณเอง) แล้วจบเลย ไม่มีการอัปโหลดไฟล์เข้า `POST /api/projects` จริง, `lib/api.ts` (frontend) ไม่มีฟังก์ชัน createProject/checkout เลย และไม่มีหน้า login/register/dashboard สำหรับลูกค้า (มีแค่หน้า login ของ admin) ทั้งที่ backend มี route เหล่านี้พร้อมอยู่แล้ว (`/api/auth/register`, `/api/projects`, `/api/projects/:id/checkout`) พูดง่ายๆคือ **ตอนนี้ลูกค้าเห็นราคาประมาณได้ แต่ยังสั่งงานจริงผ่านเว็บไม่ได้เลย**

**`required()` ใน `src/config.ts` ไม่ทำงานตามชื่อ** — ฟังก์ชันนี้ตั้งใจให้แอปตายทันทีถ้าลืมตั้งค่า `JWT_SECRET` แต่เพราะมันถูกเรียกพร้อม fallback (`'dev-secret-change-me'`) เงื่อนไข throw จึงไม่มีทางเกิดขึ้นจริง ผลคือถ้า deploy แล้วลืมตั้ง `JWT_SECRET` ระบบจะรันต่อแบบเงียบๆด้วย secret ที่รู้ค่าอยู่แล้วในซอร์สโค้ด (security risk ร้ายแรงถ้าลืมเปลี่ยนตอน deploy)

**JWT เก็บใน `localStorage`** (`apps/frontend/lib/api.ts`) แทน httpOnly cookie ตามที่ตั้งใจไว้ใน master prompt เอง ทำให้เสี่ยงต่อการขโมย token ผ่าน XSS มากกว่าการใช้ cookie

**`/api/quote` (public) รับ `estimatedPrintTime` จาก client ได้ตรงๆ** (ดู `quoteSchema` ใน `routes/quote.ts`) ถ้า field นี้ถูกส่งมา ระบบจะเชื่อค่านั้นทันทีโดยไม่คำนวณเองจากไฟล์จริง ตอนนี้ยังไม่ถูกใช้ต่อในการสร้างออเดอร์จริง (`projects.ts` คำนวณจาก `req.file.size` เสมอ) แต่ endpoint นี้เปิดช่องให้ปลอมราคาได้ถ้ามีการนำไปใช้ต่อในอนาคตโดยไม่ระวัง ควรตัด field นี้ออกจาก public endpoint หรือไม่เชื่อค่าที่ client ส่งมาเลย

**ไม่มี rate limiting** บน `/api/auth/login` และ `/register` เสี่ยงโดน brute-force รหัสผ่าน ควรเพิ่ม `express-rate-limit` ตามที่ security checklist ใน master prompt ระบุไว้เองแล้ว

---

## 2) ความแม่นยำของราคา (เชื่อมกับที่คุยกันไปก่อนหน้า)

`services/pricing.ts` → `estimatePrintTime()` ยังเป็นแค่ heuristic จาก **ขนาดไฟล์เป็นไบต์** (`fileSize / 40000` นาที) ซึ่งไม่สัมพันธ์กับเวลาพิมพ์จริงเลย — ไฟล์ STL ที่มีรายละเอียดพื้นผิวสูงแต่ตัวเล็กจะมีขนาดไบต์ใหญ่ (ประเมินเวลานานเกินจริง) ในขณะที่ไฟล์ที่ export มาแบบหยาบแต่ชิ้นใหญ่จะมีขนาดไบต์เล็ก (ประเมินเวลาน้อยเกินจริง)

`infill` ที่ผู้ใช้เลือกถูกใช้ปรับแค่ "ราคา" (`infillSurcharge`) แต่ไม่ได้ปรับ "เวลาพิมพ์ที่ประมาณ" เลย ทั้งที่ในความเป็นจริง infill สูงใช้เวลาพิมพ์นานขึ้นชัดเจน

`layerHeight` ที่ผู้ใช้เลือกได้และถูกเก็บลง DB (`Project.layerHeight`) ไม่ถูกใช้คำนวณเวลาที่ไหนเลยในปัจจุบัน — เลเยอร์บางกว่าย่อมพิมพ์นานกว่ามาก แต่ระบบไม่รู้เรื่องนี้

**แนะนำ:** ทางที่คุยกันไว้ก่อนหน้า (คำนวณจาก geometry จริงด้วย trimesh/numpy-stl เป็นค่าประมาณเร็ว หรือรัน slicer จริงอย่าง CuraEngine เป็น background job) น่าจะเข้ามาแทนที่ `estimatePrintTime()` ตัวนี้ได้พอดี ตอนนี้โค้ดยังไม่ได้ต่อกับ slicer ใดๆเลย เป็นแค่สูตรคณิตศาสตร์ง่ายๆ

---

## 3) ช่องว่างระหว่าง spec กับของจริง (ควร sync เอกสาร)

- `remaker-work-master-prompt.md` และ `QUICK-START.md` พูดถึงระบบ Queue (`QueueStatus` model, `/api/queue/status`, หน้า queue) อย่างละเอียด แต่ migration `20260911170855_remove_queue` แสดงว่าฟีเจอร์นี้ถูกถอดออกจากโค้ดจริงไปแล้ว (เหลือแค่ `dist/routes/queue.js` เป็นไฟล์ build เก่าที่ไม่ได้ import ใช้งานแล้ว) ควรอัปเดตเอกสารให้ตรงกับสถานะปัจจุบัน หรือถ้ายังต้องการฟีเจอร์นี้ต้องทำใหม่
- ไม่มี payment gateway integration ใดๆ (Stripe/Omise ตามที่ระบุใน `env-backend-template.md`) ตอนนี้ flow จบแค่ "quote" ยังไปไม่ถึง "ชำระเงินจริง" — ต้องตัดสินใจว่าจะเริ่มจากใบเสนอราคา manual ก่อน (ตามที่ README แนะนำ) หรือรีบต่อ payment gateway เลย
- `README.md`/`QUICK-START.md` อ้างคำสั่ง `npm run test`, `npm run lint` (ที่ backend) แต่ `apps/backend/package.json` ไม่มี script เหล่านี้จริง (มีแต่ `typecheck`) — รันตามคู่มือแล้วจะ error

---

## 4) ความปลอดภัย/operational อื่นๆ ที่ควรตามให้ครบ

- `README.md` เตือนเองอยู่แล้วว่า `next@14.2.15` และ `multer@1.x` มี advisory จาก `npm audit` — ยังไม่ได้ upgrade จริง ควรอัปเกรดก่อน deploy จริง
- `adminRouter.delete('/projects/:id')` ลบ record ใน DB แบบ hard-delete แต่ไม่ลบไฟล์ที่อัปโหลดจริงบนดิสก์ (ใน `uploads/`) ไฟล์จะค้างสะสมไปเรื่อยๆ ซึ่งเป็นปัญหาจริงจังบนเครื่องที่พื้นที่เก็บข้อมูลจำกัดอย่าง Pi ควรลบไฟล์คู่กันหรือย้ายไป archive
- ยังไม่มี job ทำความสะอาดไฟล์ของโปรเจกต์ที่ถูกยกเลิก/ค้างนาน
- ค่า default ปัจจุบันใน `.env` จริง (`JWT_SECRET=dev-secret-change-me`, `ADMIN_PASSWORD=admin1234`) ยังไม่ถูกเปลี่ยน — README เตือนไว้แล้วว่าต้องเปลี่ยนก่อน deploy แต่ยังไม่ได้ทำจริงในไฟล์ที่มีอยู่

---

## 5) เรื่องเล็กๆ น้อยๆ

- การยกเลิกงานของลูกค้าเอง (`DELETE /api/projects/:id`) เป็น soft-cancel (แค่เปลี่ยน status) แต่ของ admin เป็น hard-delete — พฤติกรรมไม่สอดคล้องกัน ควรเลือกแนวทางเดียว
- `dist/routes/queue.js` เป็นไฟล์ build ค้างจากฟีเจอร์ที่ถูกถอดออกไปแล้ว ลบทิ้งได้เพื่อความสะอาด (จะหายไปเองถ้า build ใหม่จาก src ที่ไม่มี queue.ts อยู่แล้ว)
- `ModelViewer` พรีวิว 3D ได้แค่ `.stl`/`.obj` แต่หน้าอัปโหลดรับ `.3mf/.gcode/.step/.stp` ด้วย — เป็นพฤติกรรมที่ตั้งใจไว้แล้ว (แจ้งผู้ใช้ว่า preview ไม่ได้แต่ประเมินราคาได้ตามปกติ) ไม่ต้องแก้ แต่ทราบไว้

---

## สรุปลำดับความสำคัญที่แนะนำ

1. ต่อ flow "อัปโหลด → ยืนยันคำสั่งซื้อ" ให้ครบจริงบน frontend (สร้างหน้า login/register ลูกค้า + เรียก `POST /api/projects` จริง)
2. แก้ `required()` ให้ throw จริงเมื่อไม่มี `JWT_SECRET` ที่ปลอดภัย และเปลี่ยนค่า default ทั้งหมดก่อน deploy
3. เริ่มวางแผนแทนที่ `estimatePrintTime()` ด้วยการประเมินจาก geometry จริงหรือ slicer จริง (ตามที่คุยกันไว้)
4. เพิ่ม rate limiting บน auth endpoints, ลบ field `estimatedPrintTime` ออกจาก public quote endpoint
5. sync เอกสาร (Queue, payment, test scripts) ให้ตรงกับโค้ดจริง แล้วค่อยตาม cleanup เรื่องไฟล์ค้าง/npm audit
