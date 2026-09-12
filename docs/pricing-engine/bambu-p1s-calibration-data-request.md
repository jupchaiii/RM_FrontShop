# Bambu Lab P1S — Calibration Data Request

เอกสารนี้ใช้เก็บข้อมูลสำหรับปรับสูตรประเมินเวลาพิมพ์ของโปรเจกต์ให้ใกล้เคียงกับ **Bambu Lab P1S** และ **Bambu Studio** มากขึ้น โดยไม่ต้องติดตั้ง slicer บน Raspberry Pi 4

## เป้าหมาย

เราจะเปรียบเทียบ:

```text
เวลาที่ระบบ Remaker ประเมิน
เทียบกับ
เวลาที่ Bambu Studio ประเมินจากการ Slice ไฟล์เดียวกัน
```

จากนั้นจะสร้าง calibration coefficients สำหรับใช้บน Pi4

> สำคัญ: กรุณาใช้ไฟล์และค่า settings เดียวกันในแต่ละรายการ ห้ามเปลี่ยนค่าแล้วนำเวลามาเทียบกันโดยไม่บันทึกการเปลี่ยนแปลง

---
## Approved minimal workflow: 3 inputs ต่อ 1 calibration job

แนวทางปัจจุบันใช้ไฟล์หลักเพียง **3 รายการ** ต่อหนึ่งงาน ไม่ต้องกรอก metadata ยาวๆ เอง:

1. **Printer preset / Bambu Studio preset** — ค่าที่ใช้กับ Bambu Lab P1S
2. **STL ของชิ้นงาน** — ไฟล์ geometry ต้นฉบับก่อน slice
3. **G-code หลัง slice STL** — ผลลัพธ์จาก Bambu Studio ที่ใช้เป็น ground truth สำหรับเทียบเวลาและเส้นทางพิมพ์

### เงื่อนไขของ preset

preset ต้องระบุได้อย่างน้อยว่าใช้:

- เครื่อง **Bambu Lab P1S**
- nozzle diameter
- process settings เช่น layer height, wall loops, top/bottom layers, infill, support และ speed
- filament/material profile และ max volumetric speed

ถ้าไฟล์ preset ที่ส่งเป็นเพียง **machine preset** และไม่มี process/filament settings ให้ส่ง preset ที่เกี่ยวข้องเพิ่ม หรือให้ข้อมูลเหล่านี้อยู่ใน G-code header อย่างครบถ้วน มิฉะนั้นจะยัง calibrate ได้ไม่สมบูรณ์

### ข้อมูลที่จะอ่านจากแต่ละ input

| Input | ข้อมูลที่ระบบจะอ่าน/คำนวณ | หน้าที่ |
|---|---|---|
| Printer preset | printer, nozzle, speed, acceleration, layer/process defaults, filament/material profile | ระบุ configuration ของ P1S |
| STL | volume, surface area, bounding box, height, triangle count | วิเคราะห์ geometry ของชิ้นงาน |
| Sliced G-code | slicer time, layer count, extrusion distance/volume, travel distance, feature types, support/raft indicators และ metadata ใน header | ใช้เป็น ground truth เพื่อปรับสูตร |

> **Required:** preset + STL + sliced G-code ต้องเป็นชุดเดียวกันและใช้ settings เดียวกัน
>
> **Optional:** screenshot, actual print time, notes, SHA-256 และข้อมูลเพิ่มเติม ใช้ตรวจสอบ/เพิ่มความแม่นยำ แต่ไม่ใช่ input หลัก

---


## ชุด calibration ที่แนะนำ

เริ่มต้นแนะนำ **5 งาน** ก่อน ถ้าต้องการความแม่นยำที่ดีขึ้นให้เพิ่มเป็น **10–20 งาน** โดยควรมีรูปร่างหลากหลาย
ส่วนรายการด้านล่างเป็นรายละเอียดประกอบของ workflow 3-input ไม่ใช่แบบฟอร์มที่ต้องกรอกทั้งหมด

- ชิ้นงานทรงกล่องหรือทรงตัน
- ชิ้นงานที่มีผนังบาง
- ชิ้นงานที่มีรูหรือรายละเอียดซับซ้อน
- ชิ้นงานที่มีพื้นที่ overhang
- ชิ้นงานที่ต้องใช้ support
- ชิ้นงานขนาดเล็กและขนาดใหญ่
- ชิ้นงานที่มี infill ต่ำและสูง

สำหรับแต่ละงาน กรุณาส่งข้อมูลต่อไปนี้:

### 1. ไฟล์โมเดลต้นฉบับ

ไฟล์ที่ต้องส่งคือ:

- `.stl` — **required** และต้องเป็นไฟล์เดียวกับที่ใช้สร้าง G-code

สำหรับ calibration รอบนี้ไม่ใช้ `.obj` หรือ `.3mf` เป็น input หลัก เพื่อให้ชุดข้อมูลทุกงานมีรูปแบบเดียวกันและเทียบผลได้ตรงกัน

ควรส่งไฟล์ที่ยังไม่ได้เปลี่ยน scale หรือ rotate หลังจาก export ถ้ามีการปรับใน Bambu Studio ให้บันทึกค่าการปรับไว้ด้วย

### 2. ไฟล์ G-code จาก Bambu Studio (จำเป็น)

ถ้าสามารถ export ได้ กรุณาส่งไฟล์:

- `.gcode`
- หรือ `.bgcode` ถ้าเป็น binary G-code

G-code จะช่วยตรวจสอบเวลาที่ slicer คำนวณ, จำนวน layer, ประเภทเส้นทาง และปริมาณ filament ได้ละเอียดกว่า screenshot

G-code เป็น input จำเป็นสำหรับ calibration รอบนี้ เพราะใช้เป็น ground truth ของเวลาจาก slicer หากส่งเป็น `.bgcode` อาจต้องแปลงเป็น text G-code ก่อน จึงแนะนำ `.gcode` เป็นหลัก

### ข้อมูลเสริม (ไม่จำเป็น): Screenshot จาก Bambu Studio

ถ้ามี screenshot ให้ใช้ตรวจสอบว่า preset และ G-code ตรงกัน โดยไม่จำเป็นต้องส่งถ้าสามารถส่ง preset + STL + G-code ได้ครบ

- ชื่อ printer profile: **Bambu Lab P1S**
- ขนาด nozzle: ปกติคือ **0.4mm**
- ชื่อ filament profile
- Layer height
- Infill percentage
- Wall loops / wall count
- Top shell layers
- Bottom shell layers
- Support เปิดหรือปิด
- Support type ถ้ามี
- Speed mode หรือ print speed
- Estimated time ที่ Bambu Studio แสดง
- Filament used ถ้าแสดงในหน้าจอ

หากข้อมูลอยู่หลายหน้าจอ สามารถส่งหลาย screenshot ต่อหนึ่งงานได้

---

## Template สำหรับติดตามข้อมูล (3 inputs + optional derived metadata)

ไม่ต้องกรอกค่าที่อยู่ใน preset หรือ G-code ซ้ำเอง ระบบจะอ่าน/คำนวณ metadata เหล่านี้ภายหลัง ใช้ template นี้เฉพาะกรณีต้องการตรวจสอบผลการ parse

```yaml
job_id: "งานที่-01"

# Required inputs — ต้องเป็นชุดเดียวกัน
printer_preset_file: "ชื่อ preset ที่ใช้กับ Bambu Studio"
printer_preset_format: "json / ini / preset export"
model_file: "ชื่อไฟล์.stl"
model_format: "stl"
sliced_gcode_file: "ชื่อไฟล์.gcode"
gcode_format: "gcode"

# Optional integrity checks
model_sha256: "ถ้าทำได้"
preset_sha256: "ถ้าทำได้"
gcode_sha256: "ถ้าทำได้"

# Printer / nozzle
printer: "Bambu Lab P1S"
nozzle_diameter_mm: 0.4
printer_profile: "ชื่อ profile ใน Bambu Studio"
print_mode: "Standard / Silent / Sport / Ludicrous / Custom"

# Filament
material: "PLA / PETG / ASA / TPU"
filament_brand: "เช่น Bambu Lab หรือยี่ห้ออื่น"
filament_profile: "ชื่อ filament profile"
filament_color: "สี ถ้าทราบ"

# Model transform ใน Bambu Studio
scale_percent: 100
rotation: "เช่น X=0, Y=0, Z=0"
arrangement: "วาง 1 ชิ้น / หลายชิ้นบน plate"

# Process settings
layer_height_mm: 0.20
first_layer_height_mm: "เช่น 0.20 หรือไม่ทราบ"
infill_percent: 20
infill_pattern: "เช่น Grid / Gyroid / Cubic / ไม่ทราบ"
wall_loops: 3
top_shell_layers: 4
bottom_shell_layers: 4
line_width_mm: "เช่น 0.42 หรือไม่ทราบ"

# Support
support_enabled: false
support_type: "ไม่มี / Normal / Tree / ไม่ทราบ"
support_overhang_angle: "องศา ถ้าทราบ"
support_critical: "ไม่มี / เล็กน้อย / มาก / ไม่ทราบ"

# เวลาจาก Bambu Studio
slicer_estimated_time: "เช่น 01h 24m 35s"
slicer_estimated_time_minutes: 84.58
filament_used_g: "เช่น 32.5"
filament_used_m: "เช่น 10.8"
layer_count: "เช่น 420 หรือไม่ทราบ"

# เวลาพิมพ์จริง (ถ้าพิมพ์แล้ว)
actual_print_time: "เช่น 01h 31m 10s หรือยังไม่ได้พิมพ์"
actual_print_time_minutes: "เช่น 91.17 หรือยังไม่ได้พิมพ์"
print_completed: false
print_notes: "เช่น หยุดกลางคัน / พิมพ์ปกติ / เปลี่ยน speed ระหว่างพิมพ์"

# ไฟล์แนบ
model_file_attached: true
gcode_file_attached: false
screenshot_attached: true
notes: "ข้อมูลเพิ่มเติม"
```

---

## ข้อมูลเสริม (ไม่บังคับ)

สำหรับ initial calibration ไม่ต้องกรอก metadata เพิ่มเอง หากส่ง **preset + STL + sliced G-code** ครบแล้ว

ข้อมูลต่อไปนี้ช่วยตรวจสอบหรือวัดความแม่นยำเพิ่ม แต่ไม่ใช่ input หลัก:

- screenshot จาก Bambu Studio
- actual print time จากเครื่อง P1S
- SHA-256 ของไฟล์
- notes กรณี pause, เปลี่ยน speed หรือพิมพ์ไม่จบ

หากมี actual print time ให้แยกจากเวลาที่ G-code ระบุ เพราะเวลาจาก slicer และเวลาพิมพ์จริงอาจต่างกัน

---

## วิธีเตรียม 3 inputs ใน Bambu Studio

สำหรับแต่ละงาน:

1. เลือก printer เป็น **Bambu Lab P1S** และเลือก nozzle/filament/process settings ที่ต้องการ
2. Export หรือรวบรวม **printer preset** ที่ใช้กับงานนั้น
3. เปิดไฟล์ STL ต้นฉบับและตรวจสอบว่าเป็นชิ้นงานเดียวกับที่จะ slice
4. กด **Slice plate** ด้วย preset ชุดเดียวกัน
5. Export **G-code** หลัง slice และตั้งชื่อให้จับคู่กับ STL/preset ได้ชัดเจน
6. เก็บไฟล์ทั้งสามไว้ในโฟลเดอร์งานเดียวกัน

### การวัดเวลาพิมพ์จริง (ไม่บังคับ)

ถ้าจะเก็บ actual print time ให้ใช้หลักเดียวกันทุกงาน:

- เริ่มจับเวลาตอนกดเริ่มพิมพ์/ส่งงานไปเครื่อง
- จบเวลาตอนเครื่องแจ้งว่างานเสร็จ
- ระบุให้ชัดว่ารวมเวลาวอร์มเครื่องและ calibration ก่อนพิมพ์หรือไม่
- ถ้ามีการหยุดเครื่อง เปลี่ยน speed หรือ pause ให้บันทึกไว้

---

## โครงสร้างโฟลเดอร์ที่แนะนำสำหรับรวบรวมข้อมูล

ไม่ควร commit ไฟล์โมเดลหรือ G-code ขนาดใหญ่เข้า Git โดยตรง แนะนำเก็บไว้นอก repository หรือใช้ cloud/storage แยก แล้วจัด metadata แบบนี้:

```text
calibration-data/
├── job-01/
│   ├── printer-preset.json   # required: preset ที่ใช้ slice งานนี้
│   ├── model.stl             # required: STL ต้นฉบับ
│   └── sliced.gcode          # required: G-code จาก Bambu Studio
├── job-02/
│   ├── printer-preset.json
│   ├── model.stl
│   └── sliced.gcode
└── README.md
```

ถ้ามีข้อมูลเสริม สามารถใส่เพิ่มได้ เช่น `screenshot.png`, `actual-print-time.txt` หรือ `notes.txt` แต่ไม่ใช่ input หลัก

---

## สิ่งที่ทีมพัฒนาจะทำหลังได้รับข้อมูล

1. ตรวจสอบว่า preset + STL + G-code เป็นชุดเดียวกันและใช้ settings เดียวกัน
2. อ่าน printer/process/filament metadata จาก preset และ G-code header
3. Parse STL เพื่อคำนวณ volume, surface area, bounding box และ geometry features
4. Parse G-code เพื่อดึง slicer time, layers, extrusion/travel และ feature path data
5. เปรียบเทียบสูตรปัจจุบันของ Remaker กับ ground truth จาก G-code
6. วิเคราะห์ error แยกตาม material, infill, layer height, support และรูปทรง
7. ปรับ calibration coefficients สำหรับ P1S
8. ทดสอบกับไฟล์ที่ไม่ได้อยู่ในชุด calibration เพื่อป้องกัน overfit
9. บันทึกค่าที่ใช้จริงไว้ในโปรเจกต์ พร้อมวันที่, preset และ printer profile

## เกณฑ์ความสำเร็จเบื้องต้น

ตั้งเป้าหมายหลัง calibration รอบแรก:

- งานทั่วไป: ความคลาดเคลื่อนประมาณ **±15–20%** จาก Bambu Studio
- งานเรียบง่าย/ไม่มี support: อาจทำได้ดีกว่านี้
- งานที่มี support, overhang หรือรายละเอียดซับซ้อน: อาจคลาดเคลื่อนมากกว่า
- เวลาจาก slicer ไม่เท่ากับเวลาพิมพ์จริงเสมอไป จึงควรแยกเก็บทั้งสองค่า

ระบบจะยังแสดงผลเป็น **เวลาประเมิน** ไม่ใช่คำรับประกันเวลาพิมพ์จริง

---

## สถานะข้อมูล

```text
จำนวนงานที่เตรียม: ____ งาน
จำนวนงานที่มี printer preset: ____ งาน
จำนวนงานที่มี STL: ____ งาน
จำนวนงานที่มี sliced G-code: ____ งาน
จำนวนงานที่มีชุด 3 inputs ครบ: ____ งาน
จำนวนงานที่มี actual print time (optional): ____ งาน
```
