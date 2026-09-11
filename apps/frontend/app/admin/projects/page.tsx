'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type Project = {
  id: string;
  fileName: string;
  material: string;
  status: string;
  estimatedCost: number;
  createdAt: string;
  user?: { email: string; name?: string };
};

export default function AdminProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .adminProjects(1)
      .then((r) => setProjects(r.projects))
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'โหลดข้อมูลไม่สำเร็จ');
        router.replace('/admin');
      })
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">โปรเจกต์ทั้งหมด</h1>
        <Link
          href="/admin/dashboard"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
        >
          ← แดชบอร์ด
        </Link>
      </div>

      {error && <p className="mt-4 text-red-600">{error}</p>}
      {loading && <p className="mt-4 text-slate-500">กำลังโหลด...</p>}

      {!loading && projects.length === 0 && (
        <p className="mt-6 text-slate-500">ยังไม่มีโปรเจกต์</p>
      )}

      {projects.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3">ไฟล์</th>
                <th className="px-4 py-3">ลูกค้า</th>
                <th className="px-4 py-3">วัสดุ</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-right">ราคา</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium">{p.fileName}</td>
                  <td className="px-4 py-3 text-slate-600">{p.user?.email ?? '-'}</td>
                  <td className="px-4 py-3">{p.material}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">{p.estimatedCost} ฿</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
