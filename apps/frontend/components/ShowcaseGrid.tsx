'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, GalleryItem } from '@/lib/api';

export function ShowcaseGrid({ limit }: { limit?: number }) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [tab, setTab] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getGallery()
      .then((r) => setItems(r.items))
      .catch((e) => setError(e instanceof Error ? e.message : 'โหลดผลงานไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, []);

  // Build filter tabs from the materials present in the showcase.
  const materials = useMemo(
    () => Array.from(new Set(items.map((i) => i.material))),
    [items]
  );

  const visible = useMemo(() => {
    const filtered = tab === 'ALL' ? items : items.filter((i) => i.material === tab);
    return limit ? filtered.slice(0, limit) : filtered;
  }, [items, tab, limit]);

  const tabs = ['ALL', ...materials];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              tab === t
                ? 'bg-brand text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t === 'ALL' ? 'ทั้งหมด' : t}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-red-600">{error}</p>}
      {loading && <p className="mt-4 text-slate-500">กำลังโหลด...</p>}

      {!loading && visible.length === 0 && (
        <p className="mt-8 text-slate-500">ยังไม่มีผลงานในหมวดนี้</p>
      )}

      {visible.length > 0 && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageUrl} alt={item.title} className="h-48 w-full object-cover" />
              <div className="p-4">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Customer Showcase
                </div>
                <h3 className="mt-1 font-semibold">{item.title}</h3>
                <p className="mt-1 text-xs text-slate-500">FDM (Plastic), {item.material}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
