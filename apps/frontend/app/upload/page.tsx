'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, getToken, Material, QuoteResult } from '@/lib/api';
import { ModelViewer } from '@/components/ModelViewer';

const LAYER_HEIGHTS = [
  { value: 0.12, label: 'ละเอียดพิเศษ (0.12mm) — ช้าลง' },
  { value: 0.16, label: 'ละเอียด (0.16mm)' },
  { value: 0.2, label: 'มาตรฐาน (0.2mm)' },
  { value: 0.28, label: 'หยาบ/เร็ว (0.28mm)' },
];

export default function UploadPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [material, setMaterial] = useState('PLA');
  const [infill, setInfill] = useState(20);
  const [layerHeight, setLayerHeight] = useState(0.2);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [ordered, setOrdered] = useState(false);

  useEffect(() => {
    api
      .getMaterials()
      .then((r) => setMaterials(r.materials))
      .catch(() => setMaterials([]));
  }, []);

  useEffect(() => {
    if (!getToken()) {
      setIsAuthed(false);
      return;
    }
    api
      .me()
      .then(() => setIsAuthed(true))
      .catch(() => setIsAuthed(false));
  }, []);

  // A fresh file selection invalidates any quote/order state from the previous file.
  useEffect(() => {
    setQuote(null);
    setOrdered(false);
    setOrderError(null);
  }, [file]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setQuote(null);
    setOrdered(false);
    if (!file) {
      setError('กรุณาเลือกไฟล์ก่อน');
      return;
    }
    setLoading(true);
    try {
      const result = await api.quoteFile(file, {
        material,
        infill,
        layerHeight,
      });
      setQuote(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmOrder() {
    if (!file) return;
    setOrderError(null);
    setOrdering(true);
    try {
      const { project } = await api.createProject(file, {
        material,
        infill,
        layerHeight,
      });
      await api.checkout(project.id);
      setOrdered(true);
      setTimeout(() => router.push('/dashboard'), 1200);
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'สั่งพิมพ์ไม่สำเร็จ');
    } finally {
      setOrdering(false);
    }
  }

  const materialOptions = materials.length
    ? materials.map((m) => ({ id: m.id, name: m.name }))
    : ['PLA', 'PETG', 'ASA', 'TPU'].map((id) => ({ id, name: id }));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">ประเมินราคางานพิมพ์ 3D</h1>
      <p className="mt-1 text-slate-600">
        อัปโหลดไฟล์ (.stl, .obj, .3mf) เลือกวัสดุ FDM เพื่อดูราคาโดยประมาณทันที — ไม่ต้องเข้าสู่ระบบก็ดูราคาได้
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">ไฟล์โมเดล</label>
          <input
            type="file"
            accept=".stl,.obj,.3mf,.gcode,.step,.stp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-brand file:px-4 file:py-2 file:text-white hover:file:bg-brand-dark"
          />
          {file && (
            <p className="mt-1 text-xs text-slate-500">
              {file.name} — {(file.size / 1024).toFixed(1)} KB
            </p>
          )}
        </div>

        <ModelViewer file={file} />

        <div>
          <label className="block text-sm font-medium text-slate-700">วัสดุ</label>
          <select
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {materialOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">ความละเอียดชั้นพิมพ์ (Layer Height)</label>
          <select
            value={layerHeight}
            onChange={(e) => setLayerHeight(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
          >
            {LAYER_HEIGHTS.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400">ชั้นบางกว่า = ผิวเรียบกว่า แต่ใช้เวลาพิมพ์นานกว่า</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Infill: {infill}%</label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={infill}
            onChange={(e) => setInfill(Number(e.target.value))}
            className="mt-2 w-full"
          />
        </div>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand px-6 py-3 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? 'กำลังคำนวณ...' : 'ประเมินราคา'}
        </button>
      </form>

      {quote && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold">ราคาสุทธิ</h2>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-brand">{quote.estimatedCost}</span>
            <span className="text-slate-600">THB</span>
          </div>

          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            สำหรับค่าบริการที่ได้รับจะเป็นค่าบริการเบื้องต้นเท่านั้น กรณีต้องการปรับแต่งเพิ่มเติมสามารถติดต่อ admin ผ่านหน้า Facebook Page หรือ LINE Official ได้เลย
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5">
            {ordered ? (
              <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                ✓ สั่งพิมพ์เรียบร้อย กำลังพาไปหน้าคำสั่งของคุณ...
              </p>
            ) : isAuthed ? (
              <div>
                {orderError && (
                  <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{orderError}</p>
                )}
                <button
                  onClick={handleConfirmOrder}
                  disabled={ordering}
                  className="w-full rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {ordering ? 'กำลังส่งคำสั่งพิมพ์...' : 'ยืนยันสั่งพิมพ์'}
                </button>
              </div>
            ) : isAuthed === false ? (
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-sm text-slate-600">เข้าสู่ระบบเพื่อยืนยันสั่งพิมพ์จริง (ไฟล์ที่เลือกไว้จะต้องเลือกใหม่อีกครั้งหลังเข้าสู่ระบบ)</p>
                <div className="mt-3 flex justify-center gap-3">
                  <Link
                    href="/login?returnTo=/upload"
                    className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                  >
                    เข้าสู่ระบบ
                  </Link>
                  <Link
                    href="/register?returnTo=/upload"
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    สมัครสมาชิก
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
