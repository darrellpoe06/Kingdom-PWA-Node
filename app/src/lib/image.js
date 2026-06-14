// =============================================================================
// image — client-side photo compression (no upload, no server)
// =============================================================================
// Shared by the maintenance log and the room photo galleries. Compresses a
// File to a JPEG data URL bounded to maxWidth, so photos persist in the
// device-local rental record (and ride sync as data URLs) without a blob
// store. A typical phone photo lands ~80-250 KB after this.
export function compressImageFile(file, maxWidth = 1280, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
