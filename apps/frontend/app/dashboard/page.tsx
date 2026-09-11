'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, clearToken, getToken, Project, STATUS_LABELS_TH } from '@/lib/api';

const STATUS_STYLES: Record<string, string> = {
  QUOTED: 'bg-slate-100 text-slate-700',
  PENDING: 'bg-amber-100 text-amber-700',
  PRINTING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login?returnTo=/dashboard');
      return;
    }
    api
      .myProjects()
      .then((r) => setProjects(r.projects))
      .catch((e) => {
        if (e instanceof Error && /Authentication|token/i.test(e.message)) {
          clearToken();
          router.replace('/login?returnTo=/dashboard');
          return;
        }
        setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ');
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function cancel(id: string) {
    try {
      await api.cancelProject(id);
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'CANCELLED' } : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ยกเลิกไม่สำเร็จ');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">คำสั่งพิมพ์ของฉัน</h1>
        <Link
          href="/upload"
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          + สั่งพิมพ์งานใหม่
        </Link>
      </div>

      {error && <p className="mt-4 text-red-600">{error}</p>}
      {loading && <p className="mt-4 text-slate-500">กำลังโหลด...</p>}

      {!loading && projects.length === 0 && (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          ยังไม่มีคำสั่งพิมพ์ — <Link href="/upload" className="text-brand hover:underline">เริ่มอัปโหลดไฟล์แรกของคุณ</Link>
        </div>
      )}

      {projects.length > 0 && (
        <div className="mt-6 space-y-3">
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
            >
              <div>
                <div className="font-semibold">{p.fileName}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {p.material} · infill {p.infill}% · layer {p.layerHeight}mm · support {p.supportType}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  สั่งเมื่อ {new Date(p.createdAt).toLocaleString('th-TH')}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-bold text-brand">{p.estimatedCost.toLocaleString()} ฿</div>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[p.status] ?? 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {STATUS_LABELS_TH[p.status]}
                  </span>
                </div>
                {(p.status === 'QUOTED' || p.status === 'PENDING') && (
                  <button
                    onClick={() => cancel(p.id)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
                  >
                    ยกเลิก
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
