import type { OptimizationResult } from "../types/listing";

type Props = {
  items: OptimizationResult[];
  onSelect: (item: OptimizationResult) => void;
};

export function HistoryList({ items, onSelect }: Props) {
  if (!items.length) {
    return (
      <div className="card">
        <p>No history for this ASIN yet.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>History ({items.length})</h2>
      <ul className="history-list">
        {items.map((item, idx) => (
          <li key={idx}>
            <button
              className="history-button"
              type="button"
              onClick={() => onSelect(item)}
            >
              Run #{items.length - idx} —{" "}
              {new Date(item.timestamp).toLocaleString()}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}