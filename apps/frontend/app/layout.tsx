import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Remaker.work — บริการพิมพ์ 3D FDM',
  description: 'อัปโหลดไฟล์ ประเมินราคางานพิมพ์ 3D FDM ได้ทันที',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Remaker.work — FDM 3D Printing Service
        </footer>
      </body>
    </html>
  );
}
