const WIDTH = 560;
const HEIGHT = 150;

export function LossSpark({ losses }: { losses: number[] }) {
  if (losses.length < 2) return <svg className="sim__spark" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" />;
  const max = Math.max(...losses, 1e-9);
  const points = losses
    .map((loss, i) => `${(i / (losses.length - 1)) * WIDTH},${HEIGHT - (loss / max) * (HEIGHT - 6) - 3}`)
    .join(' ');
  return (
    <svg className="sim__spark" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" role="img" aria-label="Training loss over time">
      <polyline points={points} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
