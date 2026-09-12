import { ShowcaseGrid } from '@/components/ShowcaseGrid';
import { ExperienceGrid } from '@/components/ExperienceGrid';

export default function GalleryPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">ผลงานที่ผ่านมา</h1>
      <p className="mt-1 text-slate-600">ตัวอย่างงานพิมพ์ 3D ระบบ FDM (พลาสติก)</p>
      <div className="mt-6">
        <ShowcaseGrid />
      </div>

      <section className="mt-16 border-t border-slate-200 pt-12">
        <h2 className="text-2xl font-bold">ประสบการณ์ทำงาน</h2>
        <p className="mt-1 text-slate-600">ผลงานจริงจากโฟลเดอร์ expr. รวม 16 โปรเจ็ค และ 45 รูปภาพ</p>
        <div className="mt-6">
          <ExperienceGrid />
        </div>
      </section>
    </div>
  );
}
