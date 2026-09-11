const faqs = [
  {
    q: 'ใช้เครื่องพิมพ์ 3D รุ่นอะไร? เชื่อถือได้แค่ไหน?',
    a: 'เราใช้เครื่องพิมพ์ FDM เกรดมืออาชีพ ดูแลและสอบเทียบสม่ำเสมอ เพื่อคุณภาพงานที่คงที่',
  },
  {
    q: 'รองรับไฟล์แบบไหน? ขนาดใหญ่แค่ไหนได้?',
    a: 'รองรับ .stl, .obj, .3mf, .gcode, .step/.stp ขนาดไม่เกิน 100MB ต่อไฟล์',
  },
  {
    q: 'ขนาดชิ้นงานที่พิมพ์ได้สูงสุดคือเท่าไหร่?',
    a: 'ขึ้นกับเครื่อง โดยทั่วไปประมาณ 200×200×200 มม. หากใหญ่กว่านี้สามารถแบ่งชิ้นประกอบได้',
  },
  {
    q: 'คิดค่าบริการอย่างไร?',
    a: 'คำนวณจากค่าวัสดุ + เวลาพิมพ์โดยประมาณ + ส่วนเพิ่มตาม infill และ support แล้วบวก VAT 7% เห็นราคาก่อนสั่งจริง',
  },
  {
    q: 'มีบริการจัดส่งแบบไหนบ้าง? ใช้เวลานานแค่ไหน?',
    a: 'ส่งทั่วไทยผ่านขนส่งเอกชน เวลาจัดส่งขึ้นกับปริมาณงานและระยะทาง เราจะแจ้งกำหนดการให้ทราบหลังยืนยันคำสั่งซื้อ',
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">คำถามที่พบบ่อย</h1>
      <div className="mt-6 space-y-3">
        {faqs.map((f) => (
          <details
            key={f.q}
            className="group rounded-xl border border-slate-200 bg-white p-4 [&_summary]:cursor-pointer"
          >
            <summary className="flex items-center justify-between font-medium text-slate-900">
              {f.q}
              <span className="text-slate-400 transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-2 text-slate-600">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
