'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, Material } from '@/lib/api';

function Bar({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="mb-1 text-xs text-slate-500">{label}</div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full ${i <= value ? 'bg-brand' : 'bg-slate-200'}`}
          />
        ))}
      </div>
    </div>
  );
}

function MaterialTable({ materials }: { materials: Material[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {materials.map((m) => (
        <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">{m.name}</h3>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {m.costPerUnit} ฿/kg
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{m.description}</p>
          <div className="mt-4 space-y-3">
            <Bar value={m.strength} label="ความแข็งแรง" />
            <Bar value={m.heatResistance} label="ทนแดด/ทนร้อน" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-slate-500">ผิวสัมผัส</div>
              <div className="font-medium text-slate-800">{m.finish}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">สรุปสั้นๆ</div>
              <div className="font-medium text-slate-800">{m.summary}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getMaterials()
      .then((r) => setMaterials(r.materials))
      .catch((e) => setError(e instanceof Error ? e.message : 'โหลดวัสดุไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold">เลือกวัสดุให้ตรงงาน ตามความต้องการของคุณ</h1>
      <p className="mt-2 text-slate-600">
        เปรียบเทียบวัสดุ FDM (พลาสติก) เพื่อให้ได้ผลลัพธ์ที่ดีที่สุดตรงกับงานของคุณ
      </p>

      {error && <p className="mt-4 text-red-600">{error}</p>}
      {loading && <p className="mt-4 text-slate-500">กำลังโหลด...</p>}

      {!loading && (
        <>
          <section className="mt-8">
            <h2 className="mb-4 text-xl font-bold">FDM Printing (Plastic)</h2>
            <MaterialTable materials={materials} />
          </section>

          <div className="mt-10 text-center">
            <Link
              href="/upload"
              className="inline-block rounded-lg bg-brand px-8 py-3 font-semibold text-white transition hover:bg-brand-dark"
            >
              เริ่มต้นประเมินราคา
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
