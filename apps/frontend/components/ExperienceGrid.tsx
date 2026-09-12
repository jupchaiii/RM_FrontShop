'use client';

import { useMemo, useState } from 'react';
import { EXPERIENCE_PROJECTS, ExperienceProject } from '@/lib/experienceData';

export function ExperienceGrid({ limit }: { limit?: number }) {
  const [category, setCategory] = useState('ALL');
  const [selected, setSelected] = useState<ExperienceProject | null>(null);
  const categories = useMemo(
    () => ['ALL', ...Array.from(new Set(EXPERIENCE_PROJECTS.map((project) => project.category)))],
    []
  );
  const visibleProjects = useMemo(() => {
    const filtered = category === 'ALL'
      ? EXPERIENCE_PROJECTS
      : EXPERIENCE_PROJECTS.filter((project) => project.category === category);
    return limit ? filtered.slice(0, limit) : filtered;
  }, [category, limit]);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium tracking-wide transition duration-300 ${
              category === item
                ? 'bg-brand text-slate-950 shadow-[0_0_18px_rgba(100,232,255,0.2)]'
                : 'border border-white/75 bg-white/65 text-slate-600 hover:border-brand/30 hover:text-slate-800'
            }`}
          >
            {item === 'ALL' ? 'ทั้งหมด' : item}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleProjects.map((project, index) => (
          <button
            key={project.slug}
            type="button"
            onClick={() => setSelected(project)}
            className="group overflow-hidden rounded-2xl border border-white/80 bg-white/60 text-left shadow-2xl transition duration-500 hover:-translate-y-2 hover:border-brand/35 hover:bg-white/[0.06]"
            style={{ animation: `card-in 600ms ${index * 50}ms both` }}
          >
            <div className={`grid h-56 gap-1 overflow-hidden bg-slate-900 ${project.images.length > 1 ? 'grid-cols-[1.35fr_1fr]' : 'grid-cols-1'}`}>
              <img
                src={project.images[0]}
                alt={project.title}
                className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
              />
              {project.images.length > 1 && (
                <div className="grid grid-rows-2 gap-1">
                  {project.images.slice(1, 3).map((image) => (
                    <img
                      key={image}
                      src={image}
                      alt=""
                      className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:opacity-100"
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand/70">Work Experience</span>
                <span className="font-mono text-[10px] text-slate-400">{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="mt-2 font-semibold text-slate-900">{project.title}</h3>
              <p className="mt-1 text-xs text-slate-500">{project.category} · {project.images.length} รูป</p>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={selected.title}
          onClick={() => setSelected(null)}
        >
          <div
            className="mx-auto max-w-5xl rounded-3xl border border-white/15 bg-white p-5 shadow-2xl sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="eyebrow">WORK EXPERIENCE / {selected.category}</div>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">{selected.title}</h3>
                <p className="mt-1 text-sm text-slate-500">ผลงานจากโฟลเดอร์ expr. · {selected.images.length} รูป</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xl leading-none text-slate-500 transition hover:border-brand hover:text-slate-900"
                aria-label="ปิดรายละเอียดผลงาน"
              >
                ×
              </button>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {selected.images.map((image) => (
                <img
                  key={image}
                  src={image}
                  alt={selected.title}
                  className="aspect-[4/3] w-full rounded-xl bg-slate-100 object-cover"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
