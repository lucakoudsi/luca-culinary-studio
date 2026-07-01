const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

export function validateImageFile(file: File): string | null {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (type.includes('heic') || type.includes('heif') || name.endsWith('.heic') || name.endsWith('.heif')) {
    return 'HEIC-Format wird nicht unterstützt. Auf dem iPhone unter Einstellungen → Kamera → Format → „Maximal kompatibel" umstellen oder als JPEG exportieren.';
  }
  if (!SUPPORTED_TYPES.has(type)) {
    const ext = file.name.split('.').pop()?.toUpperCase() ?? 'Unbekannt';
    return `Format „${ext}" wird nicht unterstützt. Bitte JPG, PNG oder WebP verwenden.`;
  }
  if (file.size > 25 * 1024 * 1024) {
    return 'Datei zu groß (max. 25 MB).';
  }
  return null;
}

export function compressImage(file: File, maxPx = 1600, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale  = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.naturalWidth  * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas nicht verfügbar')); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('Komprimierung fehlgeschlagen'))),
        'image/jpeg',
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Bild konnte nicht geladen werden')); };
    img.src = url;
  });
}
