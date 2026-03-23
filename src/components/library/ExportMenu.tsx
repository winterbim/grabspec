'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, FileSpreadsheet, FileText, Archive, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { LocalProduct, LocalProject } from '@/lib/db';

interface ExportMenuProps {
  products: LocalProduct[];
  project: LocalProject | null;
  template: string;
}

export function ExportMenu({ products, project, template }: ExportMenuProps) {
  const t = useTranslations('library');
  const [exporting, setExporting] = useState(false);

  const handleExportZip = useCallback(async () => {
    setExporting(true);
    try {
      const { downloadZip } = await import('@/lib/download');
      await downloadZip({
        products,
        template,
        projectName: project?.name ?? 'GrabSpec',
        onProgress: () => {},
      });
      toast.success(t('exportSuccess'));
    } catch {
      toast.error(t('exportError'));
    }
    setExporting(false);
  }, [products, template, project, t]);

  const handleExportExcel = useCallback(async () => {
    setExporting(true);
    try {
      const { downloadExcelOnly } = await import('@/lib/download');
      await downloadExcelOnly({
        products,
        projectName: project?.name ?? 'GrabSpec',
      });
      toast.success(t('exportSuccess'));
    } catch {
      toast.error(t('exportError'));
    }
    setExporting(false);
  }, [products, project, t]);

  const handleExportWord = useCallback(async () => {
    setExporting(true);
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
      const { saveAs } = await import('file-saver');

      const children: InstanceType<typeof Paragraph>[] = [];

      children.push(
        new Paragraph({
          text: project?.name ?? 'GrabSpec — Nomenclature produits',
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 400 },
        }),
      );

      if (project?.description) {
        children.push(new Paragraph({ text: project.description, spacing: { after: 200 } }));
      }

      // Group products by lot
      const byLot = new Map<string, LocalProduct[]>();
      for (const p of products) {
        const lot = p.lot || 'Autre';
        const arr = byLot.get(lot) ?? [];
        arr.push(p);
        byLot.set(lot, arr);
      }

      for (const [lot, lotProducts] of byLot) {
        children.push(
          new Paragraph({
            text: `Lot : ${lot}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
        );

        for (const p of lotProducts) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: p.resolvedName ?? p.inputName, bold: true }),
                new TextRun({ text: ` — ${p.manufacturer ?? ''}`, italics: true }),
              ],
              spacing: { before: 200 },
            }),
          );
          if (p.reference) {
            children.push(new Paragraph({ text: `Réf. : ${p.reference}`, spacing: { before: 50 } }));
          }
          if (p.specs) {
            const specLines = Object.entries(p.specs)
              .filter(([, v]) => v != null)
              .map(([k, v]) => `${k}: ${String(v)}`)
              .join(' | ');
            if (specLines) {
              children.push(new Paragraph({ text: specLines, spacing: { before: 50 } }));
            }
          }
        }
      }

      const doc = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${project?.name ?? 'GrabSpec'}_CCTP.docx`);
      toast.success(t('exportSuccess'));
    } catch {
      toast.error(t('exportError'));
    }
    setExporting(false);
  }, [products, project, t]);

  if (products.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" disabled={exporting} />}
      >
        {exporting ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Download className="mr-1.5 h-3.5 w-3.5" />
        )}
        {t('export')}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportZip}>
          <Archive className="mr-2 h-4 w-4" />
          {t('exportZip')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportExcel}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          {t('exportExcel')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportWord}>
          <FileText className="mr-2 h-4 w-4" />
          {t('exportWord')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
