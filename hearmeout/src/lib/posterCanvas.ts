import type { RecapData } from './types';

// Text-only by design — covers are loaded from Spotify's CDN, and drawing a
// cross-origin image onto a canvas without confirmed CORS headers taints it
// (toBlob/toDataURL then throws), which would make the download silently
// fail. Typography-only sidesteps that entirely and needs no server render.
export function drawRecapPoster(canvas: HTMLCanvasElement, data: RecapData, name: string, periodLabel: string) {
  const W = 1080;
  const H = 1350;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#171410');
  grad.addColorStop(1, '#2b1f16');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#d98a5f';
  ctx.font = '700 32px sans-serif';
  ctx.fillText('HearMeOut', 64, 100);

  ctx.fillStyle = '#948b7d';
  ctx.font = '500 26px sans-serif';
  ctx.fillText(periodLabel.toUpperCase(), 64, 150);

  ctx.fillStyle = '#efe6d9';
  ctx.font = '700 64px sans-serif';
  wrapText(ctx, name, 64, 240, W - 128, 70);

  ctx.fillStyle = '#d98a5f';
  ctx.font = '700 100px sans-serif';
  ctx.fillText(String(data.minutes), 64, 400);
  ctx.fillStyle = '#948b7d';
  ctx.font = '500 28px sans-serif';
  ctx.fillText('минут прослушано', 64, 440);

  let y = 540;
  if (data.topArtists.length) {
    ctx.fillStyle = '#948b7d';
    ctx.font = '600 22px sans-serif';
    ctx.fillText('ТОП АРТИСТЫ', 64, y);
    y += 46;
    ctx.fillStyle = '#efe6d9';
    ctx.font = '600 40px sans-serif';
    for (const a of data.topArtists.slice(0, 5)) {
      ctx.fillText(a.name, 64, y);
      y += 56;
    }
  }

  y += 40;
  if (data.topGenres.length) {
    ctx.fillStyle = '#948b7d';
    ctx.font = '600 22px sans-serif';
    ctx.fillText('ЖАНРЫ', 64, y);
    y += 40;
    ctx.fillStyle = '#c07b52';
    ctx.font = '500 30px sans-serif';
    ctx.fillText(data.topGenres.join(' · '), 64, y);
  }

  ctx.fillStyle = '#7a7266';
  ctx.font = '500 22px sans-serif';
  ctx.fillText('hearmeout', 64, H - 60);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
}
