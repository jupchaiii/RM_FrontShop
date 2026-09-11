import Link from 'next/link';
import { ShowcaseGrid } from '@/components/ShowcaseGrid';

const services = [
  {
    title: 'ปรึกษาไอเดียฟรี',
    desc: 'รับคำแนะนำจากผู้เชี่ยวชาญก่อนพิมพ์ ตรวจสอบโมเดลให้ได้ผลลัพธ์ที่ดีที่สุด',
    icon: '💡',
  },
  {
    title: 'พิมพ์พลาสติกแบบ FDM',
    desc: 'PLA, PETG, ASA, TPU — งานต้นแบบ ฟังก์ชัน และงานทนทาน',
    icon: '🧩',
  },
  {
    title: 'วัสดุหลากหลาย',
    desc: 'เลือกวัสดุให้เหมาะกับงาน ตั้งแต่งานตั้งโชว์ไปจนถึงงานใช้จริงกลางแจ้ง',
    icon: '🎨',
  },
];

const steps = [
  { n: '1', title: 'อัปโหลด', desc: 'อัปโหลดไฟล์ 3D ของคุณบนเว็บไซต์ เพื่อให้เราตรวจสอบงานพิมพ์' },
  { n: '2', title: 'ประเมินราคา', desc: 'ปรับตั้งค่าการพิมพ์ เลือกวัสดุ และเห็นราคาประเมินทันที' },
  { n: '3', title: 'ยืนยันคำสั่ง', desc: 'ตรวจสอบรายละเอียด ยืนยันคำสั่งซื้อ แล้วให้เราดูแลงานพิมพ์' },
];

export default function HomePage() {
  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark px-6 py-14 text-white md:px-10 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-blue-100">
            ประเมินราคาทันที · ส่งทั่วไทย
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight md:text-4xl">
            อัปโหลดไฟล์ รู้ราคาพิมพ์ 3D ทันที — ไม่ต้องทักแชท
          </h1>
          <p className="mt-4 text-blue-100">
            พิมพ์ 3D ระบบ FDM (พลาสติก) ปรับวัสดุและดูราคาก่อนสั่งจริง
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/upload"
              className="rounded-lg bg-white px-6 py-3 font-semibold text-brand transition hover:bg-blue-50"
            >
              ประเมินราคาทันที
            </Link>
            <Link
              href="/faq"
              className="rounded-lg border border-white/40 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              ปรึกษาไอเดียฟรี
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section>
        <div className="mb-6 text-center">
          <div className="text-sm font-medium uppercase tracking-wide text-brand">บริการของเรา</div>
          <h2 className="mt-1 text-2xl font-bold">บริการพิมพ์ 3D ระบบ FDM คุณภาพมืออาชีพ</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {services.map((s) => (
            <div key={s.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-3xl">{s.icon}</div>
              <h3 className="mt-3 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <div className="mb-6 text-center">
          <div className="text-sm font-medium uppercase tracking-wide text-brand">วิธีใช้งาน</div>
          <h2 className="mt-1 text-2xl font-bold">แค่พิมพ์ ไม่ต้องคุย ไม่ต้องรอ</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
                {s.n}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Showcase preview */}
      <section>
        <div className="mb-6 text-center">
          <div className="text-sm font-medium uppercase tracking-wide text-brand">โชว์เคสผลงาน</div>
          <h2 className="mt-1 text-2xl font-bold">เปิดโลกความเป็นไปได้ด้วยผลงานจากลูกค้าของเรา</h2>
        </div>
        <ShowcaseGrid limit={6} />
        <div className="mt-6 text-center">
          <Link
            href="/gallery"
            className="rounded-lg border border-slate-300 px-6 py-2.5 font-medium transition hover:bg-slate-100"
          >
            ดูผลงานทั้งหมด
          </Link>
        </div>
      </section>

      {/* Materials teaser */}
      <section className="rounded-2xl border border-slate-200 bg-white p-8">
        <div className="grid items-center gap-6 md:grid-cols-2">
          <div>
            <div className="text-sm font-medium uppercase tracking-wide text-brand">วัสดุ</div>
            <h2 className="mt-1 text-2xl font-bold">เลือกวัสดุให้ตรงงาน ตามความต้องการของคุณ</h2>
            <p className="mt-3 text-slate-600">
              PLA, PETG, ASA และ TPU สำหรับงาน FDM
              เปรียบเทียบความแข็งแรง การทนความร้อน และผิวสัมผัสได้ก่อนสั่ง
            </p>
            <Link
              href="/materials"
              className="mt-5 inline-block rounded-lg bg-brand px-6 py-2.5 font-semibold text-white transition hover:bg-brand-dark"
            >
              สำรวจวัสดุ
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center text-sm">
            {['PLA', 'PETG', 'ASA', 'TPU'].map((m) => (
              <div key={m} className="rounded-lg border border-slate-200 py-3 font-medium text-slate-700">
                {m}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-slate-900 px-6 py-12 text-center text-white">
        <h2 className="text-2xl font-bold">มีไอเดียใช่ไหม? พิมพ์เลย</h2>
        <p className="mt-2 text-slate-300">อัปโหลดไฟล์แล้วรู้ราคาทันที เริ่มได้เดี๋ยวนี้</p>
        <Link
          href="/upload"
          className="mt-6 inline-block rounded-lg bg-brand px-8 py-3 font-semibold text-white transition hover:bg-brand-dark"
        >
          เริ่มต้นใช้งาน
        </Link>
      </section>
    </div>
  );
}
