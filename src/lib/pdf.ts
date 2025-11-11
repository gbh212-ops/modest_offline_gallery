import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { GalleryItem } from './schema';

export type PdfMode = 'compact' | 'single';

async function renderItemCard(item: GalleryItem): Promise<HTMLDivElement> {
  const container = document.createElement('div');
  container.style.width = '512px';
  container.style.padding = '16px';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '8px';
  container.style.border = '1px solid #e5e7eb';
  container.style.borderRadius = '12px';
  container.style.background = '#ffffff';
  container.style.fontFamily = 'Inter, Helvetica, Arial, sans-serif';

  const image = document.createElement('img');
  image.src = item.thumb || item.src;
  image.alt = item.title;
  image.style.width = '100%';
  image.style.borderRadius = '8px';
  image.style.objectFit = 'cover';
  image.style.maxHeight = '320px';
  container.appendChild(image);

  const title = document.createElement('div');
  title.textContent = `${item.title} (${item.id})`;
  title.style.fontSize = '18px';
  title.style.fontWeight = '600';
  container.appendChild(title);

  if (item.category) {
    const category = document.createElement('div');
    category.textContent = item.category;
    category.style.fontSize = '14px';
    category.style.color = '#6b7280';
    container.appendChild(category);
  }

  if (item.tags.length) {
    const tags = document.createElement('div');
    tags.textContent = item.tags.join(', ');
    tags.style.fontSize = '12px';
    tags.style.color = '#4b5563';
    container.appendChild(tags);
  }

  return container;
}

export async function exportItemsToPdf(items: GalleryItem[], mode: PdfMode = 'compact') {
  if (!items.length) return;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });

  const addPageWithCanvas = (canvas: HTMLCanvasElement) => {
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
    const width = canvas.width * ratio;
    const height = canvas.height * ratio;
    const x = (pageWidth - width) / 2;
    const y = (pageHeight - height) / 2;
    pdf.addImage(imgData, 'JPEG', x, y, width, height);
  };

  if (mode === 'single') {
    for (let i = 0; i < items.length; i += 1) {
      if (i > 0) pdf.addPage();
      const card = await renderItemCard(items[i]);
      document.body.appendChild(card);
      const canvas = await html2canvas(card, { scale: 2, useCORS: true });
      addPageWithCanvas(canvas);
      document.body.removeChild(card);
    }
  } else {
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
    grid.style.gap = '16px';
    grid.style.padding = '16px';
    grid.style.width = '720px';
    grid.style.boxSizing = 'border-box';

    for (const item of items) {
      const card = await renderItemCard(item);
      grid.appendChild(card);
    }

    document.body.appendChild(grid);
    const canvas = await html2canvas(grid, { scale: 2, useCORS: true });
    addPageWithCanvas(canvas);
    document.body.removeChild(grid);
  }

  pdf.save(`gallery-${mode}.pdf`);
}
