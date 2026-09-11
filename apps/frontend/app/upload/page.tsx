'use client';

import { useEffect, useState } from 'react';
import { api, Material, QuoteResult } from '@/lib/api';
import { ModelViewer } from '@/components/ModelViewer';

const SUPPORT_TYPES = ['None', 'Tree', 'Linear'];

export default function UploadPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [material, setMaterial] = useState('PLA');
  const [infill, setInfill] = useState(20);
  const [supportType, setSupportType] = useState('None');
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getMaterials()
      .then((r) => setMaterials(r.materials))
      .catch(() => setMaterials([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setQuote(null);
    if (!file) {
      setError('กรุณาเลือกไฟล์ก่อน');
      return;
    }
    setLoading(true);
    try {
      const result = await api.quote({
        fileSize: file.size,
        material,
        infill,
        supportType,
      });
      setQuote(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  const materialOptions = materials.length
    ? materials.map((m) => ({ id: m.id, name: m.name }))
    : ['PLA', 'PETG', 'ASA', 'TPU'].map((id) => ({ id, name: id }));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">ประเมินราคางานพิมพ์ 3D</h1>
      <p className="mt-1 text-slate-600">
        อัปโหลดไฟล์ (.stl, .obj, .3mf) เลือกวัสดุ FDM เพื่อดูราคาโดยประมาณทันที
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

        <div className="grid gap-4 sm:grid-cols-2">
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
            <label className="block text-sm font-medium text-slate-700">Support</label>
            <select
              value={supportType}
              onChange={(e) => setSupportType(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2"
            >
              {SUPPORT_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
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
          <h2 className="text-lg font-bold">ผลการประเมิน</h2>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-brand">{quote.estimatedCost}</span>
            <span className="text-slate-600">THB (รวม VAT)</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            เวลาพิมพ์โดยประมาณ: {Math.floor(quote.estimatedTime / 60)} ชม. {quote.estimatedTime % 60} นาที
          </p>
          <table className="mt-4 w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              <Row label="ค่าวัสดุ" value={quote.breakdown.material} />
              <Row label="ค่าเวลาพิมพ์" value={quote.breakdown.printTime} />
              <Row label="ส่วนเพิ่ม Infill" value={quote.breakdown.infillSurcharge} />
              <Row label="ค่า Support" value={quote.breakdown.supportCost} />
              <Row label="ยอดรวมย่อย" value={quote.breakdown.subtotal} />
              <Row label="VAT 7%" value={quote.breakdown.tax} />
              <Row label="รวมทั้งสิ้น" value={quote.breakdown.total} bold />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <tr className={bold ? 'font-bold text-slate-900' : 'text-slate-600'}>
      <td className="py-2">{label}</td>
      <td className="py-2 text-right">{value.toFixed(2)} THB</td>
    </tr>
  );
}
