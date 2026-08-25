export function StarsAvg({ rating }: { rating: number }) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  return (
    <div className="star-rating avg">
      <div className="layer base">★★★★★</div>
      <div className="layer fill" style={{ width: `${pct}%` }}>★★★★★</div>
    </div>
  );
}
