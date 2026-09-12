import Link from 'next/link';
import { MotionReveal } from '@/components/MotionReveal';
import { ShowcaseGrid } from '@/components/ShowcaseGrid';
import { ExperienceGrid } from '@/components/ExperienceGrid';

const services = [
  {
    index: '01',
    title: 'ปรึกษาไอเดียฟรี',
    desc: 'ตรวจสอบโมเดลและเลือกแนวทางพิมพ์ที่เหมาะกับชิ้นงานของคุณก่อนเริ่มผลิตจริง',
    tag: 'GUIDANCE',
  },
  {
    index: '02',
    title: 'FDM ระดับโปร',
    desc: 'พิมพ์ด้วย Bambu Lab P1S พร้อมวัสดุ PLA, PETG, ASA และ TPU สำหรับงานหลายรูปแบบ',
    tag: 'P1S / FDM',
  },
  {
    index: '03',
    title: 'ราคาโปร่งใส',
    desc: 'ปรับ material, infill และ layer height แล้วเห็นราคาและเวลาประเมินก่อนยืนยันคำสั่ง',
    tag: 'INSTANT QUOTE',
  },
];

const steps = [
  { n: '01', title: 'อัปโหลดโมเดล', desc: 'วางไฟล์ 3D ของคุณลงในระบบเพื่อเริ่มตรวจสอบ geometry' },
  { n: '02', title: 'ปรับพารามิเตอร์', desc: 'เลือกวัสดุ ความละเอียด และ infill ให้เหมาะกับการใช้งาน' },
  { n: '03', title: 'ยืนยันการผลิต', desc: 'ตรวจสอบ quote แล้วส่งงานเข้าสู่คิวการผลิตของเรา' },
];

export default function HomePage() {
  return (
    <div className="relative overflow-hidden pb-10">
      <div className="site-grid pointer-events-none absolute inset-x-0 top-0 h-[720px]" />
      <div className="apple-ambient apple-ambient-blue" />
      <div className="apple-ambient apple-ambient-purple" />

      <section className="relative pb-20 pt-8 lg:pt-16">
        <MotionReveal className="relative z-10 max-w-4xl">
          <div className="eyebrow flex items-center gap-2">
            <span className="h-px w-8 bg-brand" /> REMAKER / DIGITAL FABRICATION
          </div>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.05em] text-slate-900 md:text-7xl">
            เปลี่ยนโมเดลให้เป็น
            <span className="text-gradient block">ชิ้นงานจริง</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-slate-600 md:text-lg">
            บริการพิมพ์ 3D FDM ที่ช่วยให้คุณอัปโหลดไฟล์ ปรับสเปก และเห็นราคาโดยประมาณได้ทันที
            พร้อม production workflow ที่ออกแบบมาสำหรับงานจริง
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/upload"
              className="group inline-flex items-center gap-3 rounded-full bg-brand px-6 py-3.5 font-semibold text-slate-950 shadow-[0_0_35px_rgba(100,232,255,0.22)] transition duration-300 hover:-translate-y-1 hover:bg-brand-light hover:shadow-[0_0_45px_rgba(100,232,255,0.42)]"
            >
              เริ่มประเมินราคา
              <span className="transition-transform duration-300 group-hover:translate-x-1">↗</span>
            </Link>
            <Link
              href="/gallery"
              className="rounded-full border border-slate-200 bg-white/70 px-6 py-3.5 font-medium text-slate-700 transition duration-300 hover:-translate-y-1 hover:border-brand/50 hover:bg-brand/10"
            >
              ดูผลงานของเรา
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-xs uppercase tracking-[0.18em] text-slate-500">
            <span><b className="text-slate-700">P1S</b> production ready</span>
            <span><b className="text-slate-700">0.12–0.28</b> mm layers</span>
            <span><b className="text-slate-700">4</b> material profiles</span>
          </div>
        </MotionReveal>
      </section>

      <MotionReveal className="glass-panel relative grid gap-5 rounded-2xl p-5 sm:grid-cols-3 sm:p-7">
        {[
          ['01', 'UPLOAD', 'ส่งไฟล์ได้ง่าย ไม่ต้องติดตั้งโปรแกรม'],
          ['02', 'CONFIGURE', 'เห็นผลของ layer และ infill ทันที'],
          ['03', 'MAKE REAL', 'เดินหน้าจาก quote ไปสู่งานผลิต'],
        ].map(([number, label, detail]) => (
          <div key={number} className="group flex gap-4 border-white/75 sm:border-r sm:px-5 first:sm:pl-0 last:sm:border-0 last:sm:pr-0">
            <span className="font-mono text-sm text-brand">{number}</span>
            <div>
              <div className="text-xs font-bold tracking-[0.2em] text-slate-700">{label}</div>
              <p className="mt-1 text-sm text-slate-500 transition-colors group-hover:text-slate-300">{detail}</p>
            </div>
          </div>
        ))}
      </MotionReveal>

      <section className="relative mt-28">
        <MotionReveal>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="eyebrow">SYSTEM CAPABILITIES</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">ทุกขั้นตอนชัดเจน ตั้งแต่ไฟล์ถึงชิ้นงาน</h2>
            </div>
            <span className="font-mono text-xs tracking-[0.18em] text-slate-600">RMK / 003</span>
          </div>
        </MotionReveal>
        <div className="grid gap-4 md:grid-cols-3">
          {services.map((service, index) => (
            <MotionReveal key={service.index} delay={index * 90}>
              <div className="group glass-panel h-full rounded-2xl p-6 transition duration-500 hover:-translate-y-2 hover:border-brand/40 hover:shadow-[0_20px_70px_rgba(23,180,211,0.12)]">
                <div className="flex items-start justify-between">
                  <span className="font-mono text-sm text-brand">{service.index}</span>
                  <span className="rounded-full border border-white/75 px-2.5 py-1 text-[9px] font-semibold tracking-[0.16em] text-slate-500 transition group-hover:border-brand/30 group-hover:text-brand">
                    {service.tag}
                  </span>
                </div>
                <h3 className="mt-16 text-xl font-semibold text-slate-900">{service.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{service.desc}</p>
                <div className="mt-7 h-px w-10 bg-brand/60 transition-all duration-500 group-hover:w-full" />
              </div>
            </MotionReveal>
          ))}
        </div>
      </section>

      <section className="relative mt-28 grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <MotionReveal>
          <div className="eyebrow">THE WORKFLOW</div>
          <h2 className="mt-3 max-w-md text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">จากไอเดียไปสู่ชิ้นงานจริงในไม่กี่ขั้นตอน</h2>
          <p className="mt-5 max-w-md leading-7 text-slate-600">ลดขั้นตอนที่ไม่จำเป็น แล้วใช้ข้อมูลของโมเดลช่วยตัดสินใจก่อนเริ่มผลิต</p>
        </MotionReveal>
        <div className="grid gap-3">
          {steps.map((step, index) => (
            <MotionReveal key={step.n} delay={index * 100}>
              <div className="group flex items-start gap-5 rounded-2xl border border-white/75 bg-white/55 p-5 transition duration-300 hover:border-brand/30 hover:bg-brand/[0.05]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand/30 font-mono text-sm text-brand transition group-hover:bg-brand group-hover:text-slate-950">
                  {step.n}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{step.desc}</p>
                </div>
                <span className="ml-auto text-xl text-slate-700 transition group-hover:translate-x-1 group-hover:text-brand">→</span>
              </div>
            </MotionReveal>
          ))}
        </div>
      </section>

      <section className="relative mt-28">
        <MotionReveal>
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <div className="eyebrow">SELECTED OUTPUTS</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">ชิ้นงานที่เกิดขึ้นจริง</h2>
            </div>
            <Link href="/gallery" className="hidden text-sm text-brand transition hover:text-brand-light sm:block">VIEW ALL ↗</Link>
          </div>
        </MotionReveal>
        <ShowcaseGrid limit={6} />
      </section>

      <section className="relative mt-28">
        <MotionReveal>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="eyebrow">WORK EXPERIENCE</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">ประสบการณ์ทำงานของเรา</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                รวมผลงานจริงจากงาน functional parts, electronics, robotics, decorative design และ batch production
              </p>
            </div>
            <Link href="/gallery" className="hidden text-sm text-brand transition hover:text-brand-light sm:block">VIEW ALL ↗</Link>
          </div>
        </MotionReveal>
        <ExperienceGrid limit={6} />
      </section>

      <MotionReveal className="relative mt-28 overflow-hidden rounded-3xl border border-brand/20 bg-gradient-to-br from-blue-100/80 via-white/60 to-violet-100/80 p-8 text-center md:p-14">
        <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-80 -translate-x-1/2 rounded-full bg-brand/20 blur-[90px]" />
        <div className="relative">
          <div className="eyebrow">READY TO MAKE</div>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 md:text-5xl">มีโมเดลอยู่แล้ว ให้เราช่วยทำให้มันเกิดขึ้น</h2>
          <p className="mx-auto mt-4 max-w-lg text-slate-600">อัปโหลดไฟล์ เลือกวัสดุ แล้วเริ่มจากราคา estimate ที่โปร่งใส</p>
          <Link href="/upload" className="mt-8 inline-flex rounded-full bg-white px-7 py-3.5 font-semibold text-slate-950 transition duration-300 hover:-translate-y-1 hover:bg-brand-light">
            เริ่มอัปโหลดไฟล์ <span className="ml-2">↗</span>
          </Link>
        </div>
      </MotionReveal>
    </div>
  );
}
