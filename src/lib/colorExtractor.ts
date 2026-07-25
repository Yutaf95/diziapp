export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Extracts dominant/vibrant color from an image URL using HTML Canvas pixel sampling.
 * Gracefully falls back to seed hashing if CORS or network issues prevent direct sampling.
 */
export function extractDominantColor(
  imageUrl: string,
  fallbackSeed: string,
  callback: (color: RGBColor) => void
): void {
  if (!imageUrl) {
    callback(hashSeedToColor(fallbackSeed));
    return;
  }

  const img = new Image();
  img.crossOrigin = 'Anonymous';

  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 30;
      canvas.height = 30;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        callback(hashSeedToColor(fallbackSeed));
        return;
      }

      ctx.drawImage(img, 0, 0, 30, 30);
      const imageData = ctx.getImageData(0, 0, 30, 30).data;

      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      let maxSat = -1;
      let vibrantColor: RGBColor | null = null;

      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];

        if (a < 128) continue; // skip transparent pixels

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const lum = (max + min) / 2;
        const sat = max === 0 ? 0 : (max - min) / max;

        // Target vibrant pixels that are neither too dark nor too blown out
        if (lum > 25 && lum < 230) {
          rSum += r;
          gSum += g;
          bSum += b;
          count++;

          if (sat > maxSat && sat > 0.15) {
            maxSat = sat;
            vibrantColor = { r, g, b };
          }
        }
      }

      if (vibrantColor) {
        callback(vibrantColor);
      } else if (count > 0) {
        callback({
          r: Math.round(rSum / count),
          g: Math.round(gSum / count),
          b: Math.round(bSum / count)
        });
      } else {
        callback(hashSeedToColor(fallbackSeed));
      }
    } catch {
      // CORS security block or canvas issue -> fallback to deterministic hash color
      callback(hashSeedToColor(fallbackSeed));
    }
  };

  img.onerror = () => {
    callback(hashSeedToColor(fallbackSeed));
  };

  img.src = imageUrl;
}

export function hashSeedToColor(seed: string): RGBColor {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return hslToRgb(hue / 360, 0.70, 0.50);
}

export function hslToRgb(h: number, s: number, l: number): RGBColor {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (pVal: number, qVal: number, tVal: number) => {
      let t = tVal;
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return pVal + (qVal - pVal) * 6 * t;
      if (t < 1 / 2) return qVal;
      if (t < 2 / 3) return pVal + (qVal - pVal) * (2 / 3 - t) * 6;
      return pVal;
    };
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}
