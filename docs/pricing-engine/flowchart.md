# Flowchart — Geometry-Based Pricing Engine

## 1) ภาพรวม data flow (จากอัปโหลดไฟล์ ถึง ราคาสุดท้าย)
## 0) Approved three-input calibration workflow

```mermaid
flowchart TD
    A[Printer preset / Bambu Studio preset] --> D[Calibration job]
    B[Original STL] --> D
    C[Sliced G-code from the same STL and preset] --> D

    D --> E{Validate matching set?}
    E -->|No| F[Reject or request corrected files]
    E -->|Yes| G[Read preset and G-code metadata]
    G --> H[Parse STL geometry]
    H --> I[Parse G-code metadata and toolpaths]
    I --> J[Compare Remaker estimate with G-code slicer time]
    J --> K[Fit P1S calibration coefficients]
    K --> L[Validate on held-out jobs]
```

Required inputs are preset + STL + sliced G-code. Screenshot and actual print time are optional validation data.


```mermaid
flowchart TD
    A[ผู้ใช้เลือกไฟล์ในหน้า /upload] --> B{ฟอร์แมตไฟล์?}

    B -->|.stl| C[ส่งไฟล์ไป backend<br/>POST /api/projects]
    B -->|.obj| C
    B -->|.3mf / .gcode / .step / .stp| Z[ยังไม่รองรับ geometry parsing<br/>ใช้ heuristic ไฟล์ไบต์เดิม]

    C --> D[Backend อ่าน buffer ไฟล์ที่ multer เก็บไว้จริง<br/>ไม่เชื่อค่าใดๆจาก client]
    D --> E[STL/OBJ Geometry Parser<br/>pure TS, ไม่มี native dependency]

    E --> F{Parse สำเร็จ?}
    F -->|ไม่ — ไฟล์เสีย/format ผิด| Z
    F -->|สำเร็จ| G[ได้ mesh data:<br/>- vertices/triangles<br/>- bounding box<br/>- volume<br/>- surface area]

    G --> H[คำนวณ estimatePrintTimeFromGeometry]
    Z --> H2[คำนวณ estimatePrintTime แบบเดิม<br/>fileSize/infill/layerHeight heuristic]

    H --> I[calculateQuote]
    H2 --> I

    I --> J[QuoteResult:<br/>estimatedTime, estimatedCost, breakdown]
    J --> K[บันทึกลง Project record<br/>Prisma / SQLite]
    K --> L[ส่ง response กลับ frontend<br/>แสดงราคา + เวลาพิมพ์]
```

## 2) รายละเอียดขั้น Geometry Parser → เวลาพิมพ์

```mermaid
flowchart TD
    A[Mesh triangles<br/>vertex1, vertex2, vertex3 ต่อ triangle] --> B[คำนวณ Volume<br/>รวม signed tetrahedron volume<br/>ของทุก triangle]
    A --> C[คำนวณ Surface Area<br/>รวมพื้นที่ทุก triangle]
    A --> D[คำนวณ Bounding Box<br/>min/max x,y,z]

    D --> E[Height = maxZ - minZ]
    E --> F[Layer Count = Height / layerHeight]

    B --> G[Inner Volume ≈ Volume - Shell Volume]
    C --> H[Shell Volume ≈ Surface Area × Wall Thickness]
    H --> G

    G --> I[Infill Volume = Inner Volume × infill%]
    H --> J[Plastic Volume = Shell Volume + Infill Volume]
    I --> J

    J --> K[Extrusion Time = Plastic Volume / Flow Rate<br/>Flow Rate ขึ้นกับวัสดุ+nozzle+speed]
    F --> L[Layer Change Time = Layer Count × Per-Layer Overhead]

    K --> M[Estimated Print Time =<br/>Extrusion Time + Layer Change Time]
    L --> M

    M --> N{ค่าที่ได้สมเหตุสมผล?<br/>clamp เหมือน heuristic เดิม<br/>15 min .. 48 hr}
    N --> O[Return estimatedMinutes]
```

## 3) Sequence ระหว่าง Frontend / Backend / Database (order flow เต็ม)

```mermaid
sequenceDiagram
    participant U as ผู้ใช้ (เบราว์เซอร์)
    participant FE as Frontend (/upload)
    participant BE as Backend API
    participant P as Geometry Parser
    participant DB as SQLite (Prisma)

    U->>FE: เลือกไฟล์ .stl + ตั้งค่า material/infill/layerHeight
    FE->>FE: ModelViewer parse ด้วย three.js (แค่ preview 3D)
    FE->>U: แสดงโมเดล 3D

    Note over U,FE: หน้า /api/quote (public, ไม่ login) ยังใช้ heuristic เดิม<br/>เพราะยังไม่มีไฟล์จริงส่งไป backend

    U->>FE: กด "ยืนยันสั่งพิมพ์" (ต้อง login แล้ว)
    FE->>BE: POST /api/projects (multipart: ไฟล์จริง + config)
    BE->>BE: multer เก็บไฟล์ลงดิสก์ (uploads/)
    BE->>P: อ่าน buffer จากไฟล์ที่เพิ่งเก็บ ส่งเข้า parser
    P->>P: parse triangles → volume, surface area, bbox
    P-->>BE: geometry result (หรือ null ถ้า parse ไม่ได้)

    alt parse สำเร็จ
        BE->>BE: estimatePrintTimeFromGeometry(geometry, infill, layerHeight, material)
    else parse ไม่ได้ / ฟอร์แมตไม่รองรับ
        BE->>BE: estimatePrintTime(fileSize, infill, layerHeight) [heuristic เดิม]
    end

    BE->>BE: calculateQuote(...) → ราคารวม VAT
    BE->>DB: บันทึก Project (estimatedTime, estimatedCost, filePath, ...)
    DB-->>BE: Project record
    BE-->>FE: 201 Created { project, quote }
    FE->>U: แสดงราคาสุดท้าย + redirect ไป /dashboard
```

## 4) Fallback decision (เมื่อไหร่ใช้ geometry จริง vs heuristic)

```mermaid
flowchart LR
    A[มีไฟล์จริงส่งมาที่ backend หรือไม่?] -->|ไม่มี — public /api/quote| B[heuristic เดิม<br/>fileSize/infill/layerHeight]
    A -->|มี — POST /api/projects| C{นามสกุลไฟล์ = .stl หรือ .obj?}
    C -->|ไม่ใช่| B
    C -->|ใช่| D{Parser อ่านไฟล์สำเร็จ<br/>ไม่ timeout, ไม่ corrupt?}
    D -->|ไม่สำเร็จ| B
    D -->|สำเร็จ| E[geometry-based calculation]
    E --> F[ราคาที่แม่นยำขึ้น]
    B --> G[ราคาประมาณแบบเดิม<br/>ระบุใน response ว่าเป็น estimate คร่าวๆ]
```
