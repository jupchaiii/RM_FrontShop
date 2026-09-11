import { ShowcaseGrid } from '@/components/ShowcaseGrid';

export default function GalleryPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">ผลงานที่ผ่านมา</h1>
      <p className="mt-1 text-slate-600">ตัวอย่างงานพิมพ์ 3D ระบบ FDM (พลาสติก)</p>
      <div className="mt-6">
        <ShowcaseGrid />
      </div>
    </div>
  );
}
