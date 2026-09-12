'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, clearToken, getToken, AuthUser } from '@/lib/api';

const links = [
  { href: '/', label: 'หน้าแรก' },
  { href: '/materials', label: 'วัสดุ' },
  { href: '/gallery', label: 'ผลงาน' },
  { href: '/faq', label: 'FAQ' },
];

export function Navbar() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      setChecked(true);
      return;
    }
    api
      .me()
      .then((r) => setUser(r.user))
      .catch(() => clearToken())
      .finally(() => setChecked(true));
  }, []);

  function logout() {
    clearToken();
    setUser(null);
    window.location.href = '/';
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/75 bg-white/60 shadow-[0_8px_30px_rgba(58,75,105,0.08)] backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand/40 bg-brand/10 font-mono text-xs font-bold text-brand transition group-hover:rotate-12 group-hover:bg-brand group-hover:text-slate-950">R</span>
          <span className="text-base font-semibold tracking-tight text-slate-900">Remaker<span className="text-brand">.work</span></span>
        </Link>
        <div className="flex items-center gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hidden rounded-full px-3 py-2 text-slate-500 transition hover:bg-white/75 hover:text-slate-900 sm:block"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/upload"
            className="ml-2 rounded-full border border-brand/50 bg-brand px-4 py-2 font-semibold text-slate-950 shadow-[0_0_20px_rgba(100,232,255,0.12)] transition duration-300 hover:-translate-y-0.5 hover:bg-brand-light hover:shadow-[0_0_28px_rgba(100,232,255,0.3)]"
          >
            ประเมินราคา <span className="ml-1">↗</span>
          </Link>

          {checked && user && user.role !== 'ADMIN' && (
            <>
              <Link href="/dashboard" className="ml-1 hidden rounded-full px-3 py-2 text-slate-500 transition hover:bg-white/75 hover:text-slate-900 sm:block">คำสั่งของฉัน</Link>
              <button type="button" onClick={logout} className="ml-1 rounded-full px-2 py-2 text-xs text-slate-600 transition hover:text-slate-800">ออกจากระบบ</button>
            </>
          )}

          {checked && !user && (
            <Link href="/login" className="ml-1 hidden rounded-full px-3 py-2 text-slate-500 transition hover:bg-white/75 hover:text-slate-900 sm:block">เข้าสู่ระบบ</Link>
          )}

          <Link href="/admin" className="ml-1 rounded-full px-2 py-2 text-[10px] uppercase tracking-widest text-slate-700 transition hover:text-brand">Admin</Link>
        </div>
      </nav>
    </header>
  );
}
