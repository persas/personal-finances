'use client';

import { useState, useCallback, type RefObject } from 'react';

interface UseExportPdfOptions {
  filename: string;
  scale?: number;
}

export function useExportPdf(
  ref: RefObject<HTMLDivElement | null>,
  options: UseExportPdfOptions,
) {
  const [isExporting, setIsExporting] = useState(false);

  const exportPdf = useCallback(async () => {
    const element = ref.current;
    if (!element) return;

    setIsExporting(true);
    try {
      const [html2canvasModule, jsPDFModule] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);
      const html2canvas = html2canvasModule.default;
      const { jsPDF } = jsPDFModule;

      // Hide elements marked as pdf-hide
      const hidden: HTMLElement[] = [];
      element.querySelectorAll('.pdf-hide').forEach((el) => {
        const htmlEl = el as HTMLElement;
        hidden.push(htmlEl);
        htmlEl.style.display = 'none';
      });

      const canvas = await html2canvas(element, {
        scale: options.scale ?? 2,
        useCORS: true,
        logging: false,
        backgroundColor: null,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      // Restore hidden elements
      hidden.forEach((el) => {
        el.style.display = '';
      });

      // A4 dimensions in mm
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;

      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF('portrait', 'mm', 'a4');

      let yOffset = 0;

      while (yOffset < imgHeight) {
        if (yOffset > 0) {
          pdf.addPage();
        }

        const sourceY = (yOffset / imgHeight) * canvas.height;
        const sourceHeight = Math.min(
          (usableHeight / imgHeight) * canvas.height,
          canvas.height - sourceY,
        );
        const sliceHeight = (sourceHeight / canvas.height) * imgHeight;

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sourceHeight;
        const ctx = sliceCanvas.getContext('2d')!;
        ctx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sourceHeight,
          0,
          0,
          canvas.width,
          sourceHeight,
        );

        const sliceData = sliceCanvas.toDataURL('image/png');
        pdf.addImage(sliceData, 'PNG', margin, margin, imgWidth, sliceHeight);

        yOffset += usableHeight;
      }

      pdf.save(options.filename);
    } catch (error) {
      console.error('PDF export failed:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  }, [ref, options.filename, options.scale]);

  return { exportPdf, isExporting };
}
