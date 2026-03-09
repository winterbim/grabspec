'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export function BusinessExcelPreview() {
  const t = useTranslations('pricing.business');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`mt-6 overflow-hidden rounded-xl border border-purple-200/50 bg-white shadow-lg transition-all duration-700 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      {/* Label */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-2 text-center">
        <span className="text-xs font-bold uppercase tracking-widest text-purple-600">
          {t('excelPreviewLabel')}
        </span>
      </div>

      {/* Mini Excel mockup */}
      <div className="p-3">
        {/* Company header */}
        <div className="mb-2 flex items-start justify-between rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-slate-700 to-blue-600 text-[10px] font-black text-white">
              AC
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-800">ACME Construction SA</div>
              <div className="text-[9px] text-slate-400">Rue du Commerce 42, 1003 Lausanne</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-700">Projet Villa Dupont</div>
            <div className="text-[9px] text-slate-400">P-2024-087 &bull; M. Dupont</div>
          </div>
        </div>

        {/* Blue separator */}
        <div className="mb-2 h-[2px] rounded bg-blue-600" />

        {/* Table */}
        <div className="overflow-hidden rounded-md border border-slate-200">
          <div className="flex bg-blue-600 px-2 py-1">
            {['Nom', 'Fabricant', 'Réf.', 'Lot'].map((h) => (
              <div key={h} className="flex-1 text-[9px] font-bold text-white">{h}</div>
            ))}
          </div>
          {[
            ['Eurosmart Mixer', 'GROHE', '33265003', 'Plomberie'],
            ['Sigma30 Plate', 'GEBERIT', '115.883', 'Plomberie'],
            ['iC60N 16A', 'SCHNEIDER', 'A9F742', 'Electricité'],
          ].map((row, i) => (
            <div
              key={i}
              className={`flex px-2 py-0.5 ${i % 2 === 1 ? 'bg-slate-50' : 'bg-white'}`}
            >
              {row.map((cell, j) => (
                <div key={j} className={`flex-1 text-[9px] text-slate-600 ${j >= 2 ? 'font-mono' : ''}`}>
                  {cell}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
