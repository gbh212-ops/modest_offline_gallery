(function (global) {
  'use strict';

  function escapeCsvValue(value) {
    const text = value == null ? '' : String(value);
    if (/[",\n]/.test(text)) {
      return '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
  }

  function exportToCsv(items, filename) {
    if (!Array.isArray(items) || items.length === 0) {
      return;
    }

    const columns = ['code', 'title', 'category', 'tags', 'src', 'price'];
    const rows = [columns.join(',')];

    items.forEach((item) => {
      const line = columns
        .map((key) => {
          if (key === 'tags') {
            const tags = Array.isArray(item.tagsList) ? item.tagsList : item.tags;
            if (Array.isArray(tags)) {
              return escapeCsvValue(tags.join(' '));
            }
            return escapeCsvValue(tags);
          }
          if (key === 'category') {
            return escapeCsvValue(item.categoryName || item.category || 'Uncategorized');
          }
          if (key === 'price') {
            const value = typeof item.price === 'number' && Number.isFinite(item.price)
              ? item.price.toFixed(2)
              : item.price;
            return escapeCsvValue(value);
          }
          return escapeCsvValue(item[key]);
        })
        .join(',');
      rows.push(line);
    });

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'gallery.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function buildMailto(subject, lines) {
    const safeSubject = encodeURIComponent(subject || '');
    const text = Array.isArray(lines) ? lines.join('\n') : '';
    const safeBody = encodeURIComponent(text);
    return `mailto:?subject=${safeSubject}&body=${safeBody}`;
  }

  global.GalleryExporters = {
    exportToCsv,
    buildMailto,
  };
})(window);
