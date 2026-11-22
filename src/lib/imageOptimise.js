/**
 * Client-side avatar optimisation.
 *
 * Avatars only ever render in a small circle (64–80px), so a full-resolution
 * phone photo is wasted bytes. This centre-crops the image to a square,
 * scales it down to `size` px, and re-encodes it as WebP before upload.
 */
const MAX_SIZE = 256;
const QUALITY = 0.8;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image')); };
    img.src = url;
  });
}

/**
 * Returns a square WebP File ready to hand to UploadFile.
 * Falls back to the original file if the browser can't encode WebP.
 */
export async function optimiseAvatar(file, size = MAX_SIZE) {
  const img = await loadImage(file);

  // Centre-crop to a square so faces aren't distorted in the circular frame.
  const edge = Math.min(img.width, img.height);
  const sx = (img.width - edge) / 2;
  const sy = (img.height - edge) / 2;
  const target = Math.min(edge, size);

  const canvas = document.createElement('canvas');
  canvas.width = target;
  canvas.height = target;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, sx, sy, edge, edge, 0, 0, target, target);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', QUALITY));
  if (!blob) return file;

  const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
  return new File([blob], name, { type: 'image/webp' });
}