export function PremiumBadge() {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', fontFamily: 'var(--font-ibm-plex-mono),monospace',
        fontSize: 9.5, fontWeight: 700, letterSpacing: '.04em', color: 'var(--on-accent)',
        background: 'var(--lime)', borderRadius: 999, padding: '2px 6px', marginLeft: 6, verticalAlign: 'middle',
      }}
    >
      PREMIUM
    </span>
  );
}
