# Geometry-Based Pricing Engine — Action Plan

สถานะ: **แผนงาน (ยังไม่เริ่มเขียนโค้ด)** — เอกสารนี้เป็นข้อตกลงร่วมก่อนเริ่ม implement
## Approved minimal calibration workflow

ใช้ input หลักเพียง **3 ไฟล์ต่อหนึ่ง calibration job**:

1. **Printer preset / Bambu Studio preset** — ต้องระบุ P1S, nozzle, process และ filament settings ที่ใช้ slice
2. **STL** — geometry ต้นฉบับของชิ้นงาน
3. **Sliced G-code** — ผลลัพธ์จากการ slice STL ด้วย preset เดียวกัน ใช้เป็น ground truth ของเวลาและ toolpath

ระบบจะอ่าน metadata จาก preset/G-code และคำนวณ geometry จาก STL อัตโนมัติ โดยไม่ต้องให้ผู้ใช้กรอก settings ซ้ำเอง

- **Required:** preset + STL + G-code ต้องเป็นชุดเดียวกัน
- **Optional:** screenshot, actual print time, notes และ file hash ใช้ตรวจสอบ/เพิ่มความแม่นยำ
- ถ้า preset มีเฉพาะ machine settings แต่ไม่มี process/filament settings ต้องส่ง preset ที่เกี่ยวข้องเพิ่ม หรือให้ G-code header มีข้อมูลครบ


## ปัญหาที่แก้

`estimatePrintTime()` ปัจจุบัน (`apps/backend/src/services/pricing.ts:65-83`) ประมาณเวลาพิมพ์จาก
**ขนาดไฟล์เป็นไบต์** (`fileSize / 40000` นาที ปรับด้วย infill/layerHeight factor) ซึ่งไม่สัมพันธ์กับ
เวลาพิมพ์จริง — ไฟล์ STL ที่มี mesh ละเอียด (triangle เยอะ) จะมีขนาดไบต์ใหญ่แต่ตัวอาจเล็ก
(ประเมินเวลานานเกินจริง) ส่วนไฟล์ที่ export แบบหยาบแต่ชิ้นใหญ่จะมีขนาดไบต์เล็ก (ประเมินน้อยเกินจริง)

## เป้าหมาย

ประเมินราคา/เวลาพิมพ์จาก **geometry จริงของโมเดล** (ปริมาตร, พื้นที่ผิว, ความสูง) โดย**ไม่พึ่ง
slicer engine จริง** (CuraEngine ฯลฯ) เพราะ:

- ต้องรันบน **Raspberry Pi 4** (ARM) — slicer engine ส่วนใหญ่เป็น native binary ที่ cross-compile/
  หาพรีบิลด์สำหรับ ARM ยากและกิน RAM/CPU มากบน Pi
- โปรเจกต์นี้เจอปัญหา npm registry ถูกบล็อกมาแล้วครั้งก่อน (ดู `MODERNIZATION-NOTES.md`) — ทางที่ปลอดภัย
  ที่สุดคือ solution ที่เป็น **pure JavaScript/TypeScript ไม่มี native dependency**

## ทำไมแนวทางนี้ถึงเป็นไปได้

Frontend มี `three.js` + `STLLoader`/`OBJLoader` ผูกไว้แล้ว (`apps/frontend/components/ModelViewer.tsx`)
สำหรับ preview 3D ซึ่ง parse mesh เป็น vertices/triangles ได้ในเบราว์เซอร์ — เป็น pure JS ล้วน พิสูจน์ว่า
parse STL/OBJ โดยไม่ต้องมี native binary ทำได้จริงในสภาพแวดล้อมนี้ เราจะใช้แนวคิดเดียวกัน (pure-JS mesh
parsing) ฝั่ง **backend** เพื่อคำนวณราคา — รันได้ชัวร์บน Pi4 เพราะไม่มีปัญหา ARM cross-compile

## หลักการคำนวณ (แทนที่ heuristic ไฟล์ไบต์)

จาก mesh triangles ของไฟล์ STL/OBJ คำนวณได้:

1. **Volume (ปริมาตรจริง)** — signed tetrahedron volume ต่อ triangle รวมกันทั้ง mesh (สูตรมาตรฐาน,
   คำนวณตรงไปตรงมาจาก vertex coordinates ไม่ต้องมี library เสริม)
2. **Bounding box height** → จำนวนชั้น (layers) = height / layerHeight
3. **Surface area** (ผิวนอกทั้งหมด, รวมพื้นที่ทุก triangle) → ใช้ประมาณปริมาตร shell/wall

เวลาพิมพ์ประมาณจาก:

```
plastic_volume = shell_volume(surface_area × wall_thickness) + infill_volume(inner_volume × infill%)
extrusion_time = plastic_volume / flow_rate(mm³/s ตาม nozzle+speed profile ต่อวัสดุ)
layer_change_time = layer_count × per_layer_overhead
estimated_minutes = extrusion_time + layer_change_time
```

ค่าคงที่ (flow rate, wall thickness, per-layer overhead) จะ fit จาก **sliced G-code** ที่สร้างด้วย Bambu Studio
และ preset ของ P1S เดียวกับ STL โดยใช้ข้อมูล 5-10 งานเป็นอย่างน้อย — ดู Phase 3

**Update: เครื่องพิมพ์ที่ deployment นี้ใช้จริงคือ Bambu Lab P1S** (nozzle 0.4mm มาตรฐาน, ใช้ Bambu Studio
เป็น slicer) — ตอนนี้ค่า flow rate ต่อวัสดุใน Phase 4 ได้ปรับมาใช้ค่า default "Max Volumetric Speed" จาก
stock filament profile ของ Bambu Studio แล้ว (PLA ~21-22mm³/s, PETG ~18-20mm³/s, ASA 32mm³/s อ้างจาก
tech-spec สำหรับ ABS ที่ใกล้เคียงกัน, TPU ใส่ค่า conservative ไว้ก่อนเพราะยังไม่มีเลขทางการ) แหล่งอ้างอิง
เต็มอยู่ใน comment ของ `services/pricing.ts` — **ยังไม่ใช่ calibration แบบสไลซ์ไฟล์จริงบน Bambu Studio
เทียบกับผลลัพธ์จากโค้ด** (นั่นยังเป็น Phase 3 เต็มรูปแบบที่ยังไม่ได้ทำ) เปลี่ยนจาก Cura/PrusaSlicer เป็น
Bambu Studio ในการ calibrate รอบถัดไปด้วย เพราะเป็น slicer ที่ตรงกับเครื่องจริง

## การตัดสินใจสำคัญที่ต้องยืนยันก่อนเริ่ม

| ประเด็น | ตัวเลือก | คำแนะนำ |
|---|---|---|
| Parse ที่ไหน | (A) Frontend คำนวณแล้วส่งผลลัพธ์ vs (B) Backend parse ไฟล์ที่อัปโหลดเองทุกครั้ง | **(B)** — ป้องกัน client ปลอมค่า geometry เพื่อปลอมราคา เหมือนปัญหาเดิมที่เคยตัด `estimatedPrintTime` ออกจาก public quote endpoint ไปแล้ว |
| Calibration inputs | Printer preset + original STL + sliced G-code จาก Bambu Studio | ต้องเป็นชุดเดียวกัน; ระบบอ่าน metadata จาก preset/G-code และ geometry จาก STL |
| Runtime on Pi4 | ไม่ต้องรับ G-code จากลูกค้าสำหรับ quote ปกติ | ใช้ calibration coefficients ที่สร้างไว้แล้วร่วมกับ STL/geometry parser |
| ฟอร์แมตที่รองรับ | STL (binary+ASCII) เป็นหลัก; G-code ใช้ใน calibration pipeline; `.3mf/.step/.stp` เป็นงานต่อไป | ใช้ heuristic เดิมเป็น fallback สำหรับฟอร์แมตที่ยัง parse ไม่ได้ |
| Library สำหรับ parse STL | เขียน parser เองแบบ minimal (binary STL format ไม่ซับซ้อน: 80-byte header + triangle records ตายตัว) vs หา pure-JS lib | เขียนเอง — format ไม่ซับซ้อน, เลี่ยงปัญหา npm registry ที่เคยเจอ, ควบคุม dependency ได้เต็มที่ |

**สถานะการตัดสินใจ:** ใช้ workflow 3 inputs นี้เป็นแนวทางที่อนุมัติแล้วสำหรับ calibration dataset

## ไฟล์ในโฟลเดอร์นี้

- `README.md` — เอกสารนี้ (action plan)
- `flowchart.md` — Mermaid flowchart ของ data flow ทั้งระบบ (เปิดดูได้ตรงใน GitHub/VS Code preview)
- `phases.md` — รายละเอียดแต่ละ phase, ไฟล์ที่จะแก้/สร้างใหม่, วิธี verify

## ลำดับ Phase (สรุปย่อ — รายละเอียดใน `phases.md`)

1. **STL geometry parser** (pure TS, ไม่มี native dep) + unit tests เทียบไฟล์ตัวอย่างที่รู้ปริมาตรจริง
2. **OBJ geometry parser** (เผื่อไว้, ใช้โครง parser เดียวกัน)
3. **Calibration** — เทียบผลลัพธ์กับ **Bambu Studio** จริง (เครื่องพิมพ์ deployment นี้คือ Bambu Lab P1S)
   บนไฟล์ทดสอบ 5-10 ไฟล์ เพื่อ tune ค่าคงที่ ค่า flow rate เบื้องต้นตอนนี้ (Phase 4) อ้างจาก default MVS
   ของ stock filament profile ใน Bambu Studio อยู่แล้ว แต่ยังไม่ได้ slice ไฟล์จริงเทียบผลลัพธ์
4. **ต่อเข้า `services/pricing.ts`** — เพิ่ม `estimatePrintTimeFromGeometry()`, ให้ `calculateQuote()`
   เลือกใช้ตัวนี้เมื่อมีไฟล์จริง, fallback เป็น heuristic เดิมเมื่อ parse ไม่ได้/ฟอร์แมตไม่รองรับ
5. **ต่อเข้า route** — `POST /api/projects` ส่ง buffer ไฟล์เข้า parser ก่อนเรียก `calculateQuote()`
6. **Performance/safety บน Pi4** — จำกัดขนาดไฟล์/timeout การ parse, ทดสอบกับไฟล์ใหญ่สุดที่ระบบรับ (100MB)
