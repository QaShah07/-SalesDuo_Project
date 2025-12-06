import type { OptimizationResult } from "../types/listing";

type Props = {
  result: OptimizationResult | null;
};

export function ResultView({ result }: Props) {
  if (!result) {
    return (
      <div className="card">
        <p>Run an optimization to see original vs optimized listing here.</p>
      </div>
    );
  }

  const { original, optimized, timestamp } = result;

  return (
    <div className="card">
      <div className="card-header">
        <h2>Result</h2>
        <p className="muted">Last optimized at {new Date(timestamp).toLocaleString()}</p>
      </div>
      <div className="two-column">
        <section>
          <h3>Original</h3>
          <p className="title">{original.title}</p>
          <ul>
            {original.bullets.map((b, idx) => (
              <li key={idx}>{b}</li>
            ))}
          </ul>
          <p>{original.description}</p>
        </section>
        <section>
          <h3>Optimized</h3>
          <p className="title">{optimized.title}</p>
          <ul>
            {optimized.bullets.map((b, idx) => (
              <li key={idx}>{b}</li>
            ))}
          </ul>
          <p>{optimized.description}</p>
          <h4>Keywords</h4>
          <p>{optimized.keywords.join(", ")}</p>
        </section>
      </div>
    </div>
  );
}