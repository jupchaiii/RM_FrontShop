'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, clearToken } from '@/lib/api';

interface Dashboard {
  totalProjects: number;
  statusCounts: Record<string, number>;
  revenue: { actual: number; estimated: number };
  galleryItems: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .adminDashboard()
      .then(setData)
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ');
        router.replace('/admin');
      });
  }, [router]);

  function logout() {
    clearToken();
    router.replace('/admin');
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">แดชบอร์ดผู้ดูแล</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/projects"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
          >
            จัดการโปรเจกต์
          </Link>
          <button
            onClick={logout}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {data && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card label="โปรเจกต์ทั้งหมด" value={`${data.totalProjects}`} />
          <Card label="รายได้ (ประมาณการ)" value={`${data.revenue.estimated.toLocaleString()} ฿`} />
          <Card label="รายได้ (จริง)" value={`${data.revenue.actual.toLocaleString()} ฿`} />
          <Card label="ผลงานในแกลเลอรี" value={`${data.galleryItems}`} />
        </div>
      )}

      {data && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">สถานะงาน</h2>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {['QUOTED', 'PENDING', 'PRINTING', 'COMPLETED', 'DELIVERED', 'CANCELLED'].map((s) => (
              <div key={s} className="rounded-lg border border-slate-200 bg-white p-3 text-center">
                <div className="text-xl font-bold">{data.statusCounts[s] ?? 0}</div>
                <div className="text-xs text-slate-500">{s}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <div className="text-2xl font-bold text-brand">{value}</div>
      <div className="mt-1 text-sm text-slate-600">{label}</div>
    </div>
  );
}
