# Implementation Phases — Geometry-Based Pricing Engine

รายละเอียดต่อจาก `README.md` — แต่ละ phase ทำแยกกันได้ ไม่ต้องรอ phase ก่อนหน้าเสร็จ 100% แต่แนะนำให้ทำตามลำดับ

---

## Phase 1 — STL Geometry Parser (core, ไม่มี native dependency)

**ไฟล์ใหม่:** `apps/backend/src/services/meshParser.ts`

**ทำอะไร:**
- Parse **binary STL** (format ตายตัว: 80-byte header, 4-byte triangle count,
  จากนั้นทุก triangle = 50 bytes: normal(12) + 3×vertex(36) + attribute(2))
- Parse **ASCII STL** (text format, `facet normal ... vertex ... endfacet`) เป็น fallback
  เผื่อไฟล์ที่ผู้ใช้อัปโหลดเป็น ASCII (พบได้แต่ไม่บ่อย)
- คำนวณจาก triangle list ที่ได้:
  - `volume` — signed tetrahedron sum: `Σ (v1 · (v2 × v3)) / 6` ต่อ triangle
  - `surfaceArea` — `Σ |(v2-v1) × (v3-v1)| / 2` ต่อ triangle
  - `boundingBox` — min/max ของ x, y, z ทุก vertex
- Return type: `{ volumeMm3: number; surfaceAreaMm2: number; boundingBox: {...}; triangleCount: number }`
- **Guard rails:** จำกัดจำนวน triangle ที่ parse (เช่น cap ที่ 5-10 ล้าน triangle) และมี timeout กัน
  ไฟล์ประหลาด/บุดกร่อนทำให้ event loop ค้าง (สำคัญมากบน Pi4 ที่ CPU จำกัด — ดู Phase 6)

**Verify:**
- Unit test เทียบกับไฟล์ STL ง่ายๆที่คำนวณ volume ได้ด้วยมือ (เช่น cube 10x10x10mm → volume ต้อง = 1000mm³
  ในค่าความคลาดเคลื่อนที่ยอมรับได้)
- ทดสอบทั้ง binary STL และ ASCII STL
- ทดสอบไฟล์เสีย/truncated → ต้อง throw/return null อย่างสุภาพ ไม่ crash process

---

## Phase 2 — OBJ Geometry Parser (ขยายจาก Phase 1)

**ไฟล์:** เพิ่มใน `meshParser.ts` เดิม หรือแยก `objParser.ts` แล้ว export interface เดียวกัน

**ทำอะไร:**
- Parse OBJ text format (`v x y z` สำหรับ vertex, `f i j k` สำหรับ face — เฉพาะ triangulated faces
  ก่อน, ถ้าเจอ face 4 จุด+ ให้ fan-triangulate แบบง่าย)
- คำนวณ volume/surfaceArea/boundingBox ด้วยสูตรเดียวกับ Phase 1 (ใช้ triangle list ร่วมกัน)

**Verify:** เหมือน Phase 1 แต่ทดสอบด้วยไฟล์ `.obj` ตัวอย่าง

---

## Phase 3 — Calibration dataset จาก 3 inputs

**ไม่มี input เพิ่มนอกเหนือจาก 3 ไฟล์หลักต่อหนึ่ง job**

**Required:**

1. `printer-preset` — preset จาก Bambu Studio ที่ใช้กับ Bambu Lab P1S; ต้องครอบคลุม printer/nozzle, process และ filament settings หรือระบุได้จากชุด preset/G-code
2. `model.stl` — STL ต้นฉบับก่อน slice
3. `sliced.gcode` — G-code ที่ได้จากการ slice `model.stl` ด้วย preset เดียวกัน

**ขั้นตอน:**

1. ตรวจสอบว่า preset, STL และ G-code เป็นชุดเดียวกัน และไม่มีการเปลี่ยน scale/setting ระหว่างไฟล์
2. อ่าน metadata จาก preset และ G-code header เช่น printer, nozzle, layer height, infill, material, estimated time และ layer count
3. Parse STL ด้วย `meshParser.ts` เพื่อคำนวณ volume, surface area, bounding box, height และ triangle count
4. Parse G-code เพื่อวัด slicer time, layer transitions, extrusion distance/volume, travel distance และ feature types
5. เทียบ estimate จาก Remaker กับเวลาที่ G-code ระบุ แล้ว fit calibration coefficients
6. แบ่งข้อมูลเป็น calibration set และ held-out validation set เพื่อป้องกัน overfit

**Optional:** screenshot, actual print time, notes และ file hash ใช้ตรวจสอบความถูกต้อง แต่ไม่จำเป็นต่อ initial calibration

**ข้อจำกัด:** G-code ใช้เป็น ground truth ตอน calibration เท่านั้น ไม่จำเป็นต้องให้ผู้ใช้ปลายทางอัปโหลด G-code เพื่อขอ quote บน Pi4; runtime จะใช้ model/geometry parser และค่าของ printer profile ที่ calibrate แล้ว

**Output:** ตาราง calibration constants ต่อ P1S + nozzle + material/process profile และรายงาน error เทียบกับเวลาจาก slicer

---

## Phase 4 — ต่อเข้า `services/pricing.ts`

**ไฟล์ที่แก้:** `apps/backend/src/services/pricing.ts`

**ทำอะไร:**
- เพิ่มฟังก์ชันใหม่ `estimatePrintTimeFromGeometry(geometry, infill, layerHeight, material)` ใช้ค่าคงที่
  จาก Phase 3
- แก้ `calculateQuote()` ให้รับ `geometry?: MeshGeometry` เพิ่มใน `QuoteInput` (optional — ไม่กระทบ
  public `/api/quote` ที่ไม่มีไฟล์จริง) ถ้ามี `geometry` → ใช้ฟังก์ชันใหม่, ถ้าไม่มี → fallback
  `estimatePrintTime()` เดิม (ไบต์ heuristic) เหมือนที่ทำอยู่ตอนนี้
- **ไม่ลบ `estimatePrintTime()` เดิม** — ยังต้องใช้เป็น fallback สำหรับ public quote endpoint และไฟล์
  ที่ parse geometry ไม่ได้

**Verify:**
- Unit test `calculateQuote()` ทั้ง 2 เคส (มี geometry / ไม่มี geometry) ต้องได้ breakdown ที่สมเหตุสมผล
- `tsc --noEmit` ผ่านสะอาด

---

## Phase 5 — ต่อเข้า route `POST /api/projects`

**ไฟล์ที่แก้:** `apps/backend/src/routes/projects.ts`

**ทำอะไร:**
- หลัง `multer` เก็บไฟล์ลงดิสก์แล้ว (`req.file.path`) อ่านไฟล์กลับมาเป็น buffer
- เช็คนามสกุลไฟล์ (`.stl`/`.obj`) → เรียก `meshParser` ถ้าตรง
- ส่งผลลัพธ์ (หรือ `undefined` ถ้า parse ไม่ได้/ฟอร์แมตไม่รองรับ) เข้า `calculateQuote({ ..., geometry })`
- **สำคัญ:** ต้อง parse ไฟล์ที่ multer เซฟไว้จริงเท่านั้น ห้ามรับ geometry จาก request body ของ client
  โดยตรง (หลักการเดียวกับที่ตัด `estimatedPrintTime` ออกจาก public quote ไปแล้ว — ไม่เชื่อ client)

**Verify:**
- ทดสอบอัปโหลดไฟล์ STL จริงผ่าน API (curl/Postman) → เช็คว่า `estimatedTime` ใน response เปลี่ยนไปตาม
  ขนาด/รูปทรงจริงของโมเดล ไม่ใช่ขนาดไบต์ไฟล์เพียงอย่างเดียว
- ทดสอบอัปโหลดไฟล์ `.3mf` → ต้อง fallback เป็น heuristic เดิมโดยไม่ error

---

## Phase 6 — Performance/safety บน Pi4

**ไม่มีไฟล์ใหม่ — เป็นการทดสอบ + tuning**

**ทำอะไร:**
- ทดสอบ parse ไฟล์ STL ขนาดใหญ่สุดที่ระบบรับ (100MB ตาม `MAX_FILE_SIZE` ปัจจุบัน) วัดเวลา/memory
  บนเครื่องที่ spec ใกล้เคียง Pi4 (4 core ARM, 4-8GB RAM) — ถ้าไม่มี Pi4 จริงให้ทดสอบบน Mac ก่อนแล้ว
  จำลอง throttle CPU
- ถ้าพบว่าไฟล์ใหญ่ parse ช้าเกินไป (บล็อก event loop นาน) พิจารณา:
  - ใย้ `worker_threads` แยก parse ออกจาก main event loop (ไม่ต้องใช้ native addon)
  - หรือจำกัดขนาดไฟล์ที่ยอมให้ parse geometry (ไฟล์ใหญ่กว่า threshold → fallback heuristic ทันที
    แทนที่จะพยายาม parse จนอืด)
- เพิ่ม timeout guard ใน `meshParser.ts` (เผื่อยังไม่ได้ทำใน Phase 1)

**Verify:**
- บันทึกเวลา parse ต่อขนาดไฟล์ (เช่น 1MB, 10MB, 50MB, 100MB) เป็นตารางอ้างอิง
- ยืนยันว่า request อื่นที่เข้ามาพร้อมกันตอน parse ไฟล์ใหญ่ไม่ถูก block นานเกินไป (ทดสอบยิง request คู่กัน)

---

## สรุป: ไฟล์ที่จะถูกสร้าง/แก้ไขทั้งหมด

| ไฟล์ | สถานะ | Phase |
|---|---|---|
| `apps/backend/src/services/meshParser.ts` | ใหม่ | 1, 2 |
| `apps/backend/src/services/pricing.ts` | แก้ไข (เพิ่มฟังก์ชัน ไม่ลบของเดิม) | 4 |
| `apps/backend/src/routes/projects.ts` | แก้ไข (เพิ่ม parse step ก่อน calculateQuote) | 5 |
| `apps/backend/src/services/meshParser.test.ts` (หรือเทียบเท่าตาม test framework ที่เลือก) | ใหม่ | 1, 2 |
| ไฟล์ทดสอบ `.stl`/`.obj` ตัวอย่าง | ใหม่ (ไม่ commit ไฟล์ใหญ่ — เก็บเฉพาะไฟล์เล็กสำหรับ test) | 1, 2, 3 |

**หมายเหตุ:** backend ยังไม่มี test framework ตั้งไว้ (`REVIEW-NOTES.md` ระบุว่า `npm run test` ที่ README
อ้างถึงไม่มี script จริงใน `apps/backend/package.json`) — Phase 1 จะต้องตั้ง test framework ก่อน
(แนะนำ `vitest` เพราะเบาและเข้ากับ `tsx`/ESM ที่ backend ใช้อยู่แล้ว) หากยังลง package ใหม่ไม่ได้
(org บล็อก npm registry ตามที่เจอมาก่อน) จะ verify ด้วย script ธรรมดา (`ts-node`/`tsx` รันไฟล์ตรงๆ
เทียบผลลัพธ์ด้วยมือ) ไปก่อน แล้วย้ายเป็น proper test เมื่อลง package ได้
