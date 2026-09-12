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

  const materials = useMemo(() => Array.from(new Set(items.map((i) => i.material))), [items]);
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
            className={`rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition duration-300 ${
              tab === t
                ? 'bg-brand text-slate-950 shadow-[0_0_18px_rgba(100,232,255,0.2)]'
                : 'border border-white/75 bg-white/65 text-slate-600 hover:border-brand/30 hover:text-slate-800'
            }`}
          >
            {t === 'ALL' ? 'ทั้งหมด' : t}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
      {loading && <p className="mt-4 text-sm text-slate-500">กำลังโหลด...</p>}
      {!loading && visible.length === 0 && <p className="mt-8 text-slate-500">ยังไม่มีผลงานในหมวดนี้</p>}

      {visible.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item, index) => (
            <div
              key={item.id}
              className="group overflow-hidden rounded-2xl border border-white/80 bg-white/60 shadow-2xl transition duration-500 hover:-translate-y-2 hover:border-brand/35 hover:bg-white/[0.06]"
              style={{ animation: `card-in 600ms ${index * 70}ms both` }}
            >
              <div className="relative overflow-hidden bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt={item.title} className="h-52 w-full object-cover opacity-80 grayscale-[0.2] transition duration-700 group-hover:scale-105 group-hover:opacity-100" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-slate-950/55 px-2 py-1 font-mono text-[9px] tracking-wider text-brand backdrop-blur">RMK / {String(index + 1).padStart(2, '0')}</span>
              </div>
              <div className="p-4">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand/70">Customer Showcase</div>
                <h3 className="mt-2 font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1 text-xs text-slate-500">FDM / {item.material}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
