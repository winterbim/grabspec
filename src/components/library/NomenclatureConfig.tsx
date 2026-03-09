'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AVAILABLE_VARS, buildNomenclaturePreview } from '@/lib/nomenclature';

interface NomenclatureConfigProps {
  template: string;
  onTemplateChange: (template: string) => void;
}

export function NomenclatureConfig({ template, onTemplateChange }: NomenclatureConfigProps) {
  const t = useTranslations('library.nomenclature');
  const locale = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localTemplate, setLocalTemplate] = useState(template);

  const handleChange = useCallback(
    (value: string) => {
      setLocalTemplate(value);
      onTemplateChange(value);
    },
    [onTemplateChange]
  );

  const insertVar = useCallback(
    (varKey: string) => {
      const input = inputRef.current;
      if (!input) return;
      const start = input.selectionStart ?? localTemplate.length;
      const end = input.selectionEnd ?? localTemplate.length;
      const tag = `{${varKey}}`;
      const next = localTemplate.slice(0, start) + tag + localTemplate.slice(end);
      handleChange(next);
      requestAnimationFrame(() => {
        input.focus();
        const pos = start + tag.length;
        input.setSelectionRange(pos, pos);
      });
    },
    [localTemplate, handleChange]
  );

  const preview = buildNomenclaturePreview(localTemplate, locale);

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {t('template')}
        </label>
        <Input
          ref={inputRef}
          value={localTemplate}
          onChange={(e) => handleChange(e.target.value)}
          className="font-mono text-sm"
        />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-medium text-slate-500">{t('variables')}</p>
        <div className="flex flex-wrap gap-1.5">
          {AVAILABLE_VARS.map((v) => (
            <Badge
              key={v.key}
              variant="secondary"
              className="cursor-pointer transition-colors hover:bg-blue-100 hover:text-blue-700"
              onClick={() => insertVar(v.key)}
            >
              {`{${v.key}}`} — {v.label[locale] ?? v.label.en}
            </Badge>
          ))}
        </div>
      </div>

      <div className="rounded-md bg-slate-50 p-3">
        <p className="text-xs font-medium text-slate-500">{t('preview')}</p>
        <p className="mt-1 break-all font-mono text-sm text-slate-800">{preview}</p>
      </div>
    </div>
  );
}
