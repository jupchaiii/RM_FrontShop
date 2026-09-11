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
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-brand">
          Remaker<span className="text-slate-900">.work</span>
        </Link>
        <div className="flex items-center gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="hidden rounded-md px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:block"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/upload"
            className="ml-2 rounded-md bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark"
          >
            ประเมินราคา
          </Link>

          {checked && user && user.role !== 'ADMIN' && (
            <>
              <Link
                href="/dashboard"
                className="ml-1 hidden rounded-md px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:block"
              >
                คำสั่งของฉัน
              </Link>
              <button
                type="button"
                onClick={logout}
                className="ml-1 rounded-md px-2 py-2 text-xs text-slate-400 transition hover:text-slate-700"
              >
                ออกจากระบบ
              </button>
            </>
          )}

          {checked && !user && (
            <Link
              href="/login"
              className="ml-1 hidden rounded-md px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:block"
            >
              เข้าสู่ระบบ
            </Link>
          )}

          <Link
            href="/admin"
            className="ml-1 rounded-md px-2 py-2 text-xs text-slate-400 transition hover:text-slate-700"
          >
            Admin
          </Link>
        </div>
      </nav>
    </header>
  );
}
