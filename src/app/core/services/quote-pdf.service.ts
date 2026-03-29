import {
  ApplicationRef,
  createComponent,
  EnvironmentInjector,
  inject,
  Injectable,
} from '@angular/core';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { QuotePreviewComponent } from '../../shared/components/quote-preview/quote-preview.component';
import type { Quote } from '../models';

@Injectable({ providedIn: 'root' })
export class QuotePdfService {
  private appRef = inject(ApplicationRef);
  private envInjector = inject(EnvironmentInjector);

  async generatePdf(
    quote: Quote,
    vatMode: 'exempt' | 'standard' = 'exempt',
    agencyName = 'A Minha Agência Web',
  ): Promise<void> {
    // Off-screen container matching .paper dimensions (680px, padding 48px 56px)
    const container = document.createElement('div');
    Object.assign(container.style, {
      position: 'absolute',
      left: '-9999px',
      top: '0',
      width: '680px',
      padding: '48px 56px',
      background: '#ffffff',
      boxSizing: 'border-box',
    });
    document.body.appendChild(container);

    // Dynamically render QuotePreviewComponent into the off-screen container
    const compRef = createComponent(QuotePreviewComponent, {
      environmentInjector: this.envInjector,
      hostElement: container,
    });
    compRef.setInput('quote', quote);
    compRef.setInput('vatMode', vatMode);
    compRef.setInput('agencyName', agencyName);
    this.appRef.attachView(compRef.hostView);
    compRef.changeDetectorRef.detectChanges();

    // Let styles apply
    await new Promise<void>((r) => setTimeout(r, 150));

    try {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = pageW / canvas.width;

      // Page 1 uses the full height; pages 2+ reserve 15mm at the top for a continuation header
      const CONT_MARGIN = 15; // mm
      const p1SliceH = Math.floor(pageH / ratio);
      const pNSliceH = Math.floor((pageH - CONT_MARGIN) / ratio);

      let srcY = 0;
      let pageIndex = 0;

      while (srcY < canvas.height) {
        if (pageIndex > 0) {
          pdf.addPage();
          // Continuation header: doc number centred + thin rule
          pdf.setFontSize(8);
          pdf.setTextColor(148, 163, 184);
          pdf.text(quote.number, pageW / 2, CONT_MARGIN - 5, { align: 'center' });
          pdf.setDrawColor(226, 232, 240);
          pdf.line(15, CONT_MARGIN - 3, pageW - 15, CONT_MARGIN - 3);
        }

        const sliceH = pageIndex === 0 ? p1SliceH : pNSliceH;
        const rawEnd = srcY + sliceH;
        const sliceEnd =
          rawEnd >= canvas.height ? canvas.height : this.findSafeBreakY(canvas, rawEnd);

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.min(sliceEnd - srcY, canvas.height - srcY);
        sliceCanvas
          .getContext('2d')!
          .drawImage(
            canvas,
            0,
            srcY,
            sliceCanvas.width,
            sliceCanvas.height,
            0,
            0,
            sliceCanvas.width,
            sliceCanvas.height,
          );

        const yPos = pageIndex === 0 ? 0 : CONT_MARGIN;
        pdf.addImage(
          sliceCanvas.toDataURL('image/png'),
          'PNG',
          0,
          yPos,
          pageW,
          sliceCanvas.height * ratio,
        );

        srcY = sliceEnd;
        pageIndex++;
      }

      pdf.save(`${quote.number}.pdf`);
    } finally {
      this.appRef.detachView(compRef.hostView);
      compRef.destroy();
      document.body.removeChild(container);
    }
  }

  /** Scan upward from targetY to find the nearest all-white row (safe page break). */
  private findSafeBreakY(canvas: HTMLCanvasElement, targetY: number): number {
    const ctx = canvas.getContext('2d')!;
    const width = canvas.width;
    const lookback = Math.floor(canvas.height * 0.08); // search up to 8% of canvas height

    for (let y = targetY; y > Math.max(0, targetY - lookback); y--) {
      const data = ctx.getImageData(0, y, width, 1).data;
      let isWhite = true;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 230 || data[i + 1] < 230 || data[i + 2] < 230) {
          isWhite = false;
          break;
        }
      }
      if (isWhite) return y;
    }
    return targetY; // fallback: cut at exact boundary
  }
}
